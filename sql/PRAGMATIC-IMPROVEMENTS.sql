-- =========================================
-- AMÉLIORATIONS PRAGMATIQUES REVILA
-- =========================================
-- Basé sur l'analyse mais en restant SIMPLE et EFFICACE
-- À exécuter APRÈS EXECUTE-TABLE-OPTIMIZATIONS.sql

-- =========================================
-- 1. CORRIGER LES VRAIS PROBLÈMES D'ADRESSE
-- =========================================

-- Ajouter le pays manquant dans order_items
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS pays VARCHAR(50) DEFAULT 'France';

-- Ajouter un flag pour savoir si tous les items ont la même adresse
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS same_address_for_all_items BOOLEAN DEFAULT true;

-- =========================================
-- 2. AMÉLIORER WEBHOOK_EVENTS (CRUCIAL)
-- =========================================

-- Ajouter les colonnes manquantes essentielles
ALTER TABLE public.webhook_events
ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS payload JSONB,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

-- Contrainte UNIQUE critique pour éviter les doublons Stripe
ALTER TABLE public.webhook_events
ADD CONSTRAINT webhook_events_stripe_event_id_unique UNIQUE (stripe_event_id);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_webhook_events_order_id_created 
ON public.webhook_events(order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_events_status 
ON public.webhook_events(status);

-- =========================================
-- 3. PASSER AUX CENTIMES (ÉVITER ERREURS MONÉTAIRES)
-- =========================================

-- Ajouter les nouvelles colonnes en centimes
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS subtotal_cents INTEGER,
ADD COLUMN IF NOT EXISTS shipping_cents INTEGER DEFAULT 299, -- 2.99€
ADD COLUMN IF NOT EXISTS discount_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_cents INTEGER,
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'EUR';

ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS unit_price_cents INTEGER,
ADD COLUMN IF NOT EXISTS line_total_cents INTEGER;

-- Migrer les données existantes (montants * 100)
UPDATE public.orders
SET 
    subtotal_cents = ROUND(subtotal_amount * 100)::INTEGER,
    shipping_cents = ROUND(shipping_amount * 100)::INTEGER,
    discount_cents = ROUND(discount_amount * 100)::INTEGER,
    total_cents = ROUND(total_amount * 100)::INTEGER
WHERE subtotal_cents IS NULL;

UPDATE public.order_items
SET 
    unit_price_cents = ROUND(unit_price * 100)::INTEGER,
    line_total_cents = ROUND(unit_price * quantity * 100)::INTEGER
WHERE unit_price_cents IS NULL;

-- Contraintes pour éviter les montants négatifs
ALTER TABLE public.orders
ADD CONSTRAINT check_amounts_positive CHECK (
    total_cents >= 0 AND
    subtotal_cents >= 0 AND
    shipping_cents >= 0
);

ALTER TABLE public.order_items
ADD CONSTRAINT check_price_positive CHECK (
    unit_price_cents >= 0 AND
    quantity > 0
);

-- =========================================
-- 4. STATUTS NORMALISÉS (PLUS CLAIR)
-- =========================================

-- Renommer les colonnes pour cohérence
ALTER TABLE public.order_items
RENAME COLUMN etat_de_commande TO fulfillment_status;

-- Mettre à jour les valeurs existantes vers un format standard
UPDATE public.order_items
SET fulfillment_status = CASE
    WHEN fulfillment_status = '1-payee' THEN 'paid'
    WHEN fulfillment_status = '2-en-production' THEN 'in_production'
    WHEN fulfillment_status = '3-expediee' THEN 'shipped'
    WHEN fulfillment_status = '4-livree' THEN 'delivered'
    ELSE fulfillment_status
END;

-- Enum pour les statuts (évite les erreurs)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status_enum') THEN
        CREATE TYPE order_status_enum AS ENUM (
            'pending', 'received', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
        CREATE TYPE payment_status_enum AS ENUM (
            'pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fulfillment_status_enum') THEN
        CREATE TYPE fulfillment_status_enum AS ENUM (
            'unfulfilled', 'in_production', 'shipped', 'delivered', 'returned'
        );
    END IF;
END $$;

-- =========================================
-- 5. CONTRAINTES UNIQUES CRITIQUES
-- =========================================

-- Order number DOIT être unique
ALTER TABLE public.orders
ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);

-- Customer email devrait être unique
ALTER TABLE public.customers
ADD CONSTRAINT customers_email_unique UNIQUE (email);

-- =========================================
-- 6. INDEX MANQUANTS IMPORTANTS
-- =========================================

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_fulfillment ON public.order_items(fulfillment_status);

-- =========================================
-- 7. VUE SIMPLIFIÉE POUR LE DASHBOARD
-- =========================================

DROP VIEW IF EXISTS public.dashboard_stats;
CREATE VIEW public.dashboard_stats AS
SELECT 
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.payment_status = 'paid' THEN o.id END) as paid_orders,
    COUNT(DISTINCT CASE WHEN o.order_status = 'shipped' THEN o.id END) as shipped_orders,
    SUM(o.total_cents) / 100.0 as total_revenue_eur,
    COUNT(DISTINCT oi.id) as total_items,
    SUM(oi.quantity) as total_quantity,
    COUNT(DISTINCT c.id) as total_customers,
    COUNT(DISTINCT CASE WHEN c.is_guest THEN c.id END) as guest_customers
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
LEFT JOIN public.customers c ON o.customer_id = c.id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days';

-- =========================================
-- 8. FONCTION DE RECALCUL DES TOTAUX
-- =========================================

CREATE OR REPLACE FUNCTION recalculate_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders
    SET 
        subtotal_cents = (
            SELECT COALESCE(SUM(line_total_cents), 0)
            FROM order_items
            WHERE order_id = NEW.order_id
        ),
        total_cents = subtotal_cents + shipping_cents - discount_cents
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour recalculer automatiquement
DROP TRIGGER IF EXISTS recalculate_on_item_change ON order_items;
CREATE TRIGGER recalculate_on_item_change
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION recalculate_order_totals();

-- =========================================
-- VÉRIFICATION FINALE
-- =========================================

SELECT 'AMÉLIORATIONS APPLIQUÉES' as status,
       COUNT(*) as tables_modifiées
FROM information_schema.tables
WHERE table_schema = 'public';

-- =========================================
-- CE QU'ON NE FAIT PAS (et pourquoi)
-- =========================================
-- 
-- ❌ Table addresses séparée : Overkill pour un MVP
-- ❌ Table item_media : Inutile, toujours 1 photo + 1 vidéo
-- ❌ Catalogue products/variants : Trop complexe pour 4 formats
-- ❌ Table shipments : Un tracking par commande suffit
-- ❌ Multi-devise : Restons en EUR pour l'instant
-- 
-- Ces améliorations pourront venir en V2 si nécessaire
-- 
-- REVILA - Améliorations pragmatiques ✅