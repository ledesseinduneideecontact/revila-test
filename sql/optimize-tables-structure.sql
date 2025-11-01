-- =========================================
-- OPTIMISATION STRUCTURE TABLES REVILA
-- =========================================
-- Script pour optimiser la structure des tables
-- Exécuter dans Supabase SQL Editor

-- =========================================
-- 1. OPTIMISER TABLE CUSTOMERS
-- =========================================

-- Ajouter les colonnes d'adresse manquantes à la table customers
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(50) DEFAULT 'France';

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);

-- =========================================
-- 2. OPTIMISER TABLE ORDER_ITEMS
-- =========================================

-- Ajouter les colonnes manquantes essentielles
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS item_type VARCHAR(20) DEFAULT 'photo', -- 'photo' ou 'frame'
ADD COLUMN IF NOT EXISTS with_frame BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS format VARCHAR(20), -- '10x15', '20x30', '30x45', 'carre'
ADD COLUMN IF NOT EXISTS frame_size VARCHAR(20), -- Pour les cadres seuls
ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64); -- Pour détecter les duplicatas

-- Modifier le type de item_number si nécessaire
ALTER TABLE public.order_items 
ALTER COLUMN item_number TYPE INTEGER USING item_number::INTEGER;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_content_hash ON public.order_items(content_hash);
CREATE INDEX IF NOT EXISTS idx_order_items_item_type ON public.order_items(item_type);

-- =========================================
-- 3. CORRIGER TABLE ORDERS
-- =========================================

-- Ajouter la colonne payment_intent_id si elle n'existe pas
-- (elle existe déjà sous le nom stripe_payment_intent_id)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255);

-- Migrer les données existantes si nécessaire
UPDATE public.orders 
SET payment_intent_id = stripe_payment_intent_id 
WHERE payment_intent_id IS NULL AND stripe_payment_intent_id IS NOT NULL;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id ON public.orders(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- =========================================
-- 4. VUES POUR SIMPLIFIER LES REQUÊTES
-- =========================================

-- Vue pour avoir un résumé des commandes avec items groupés
CREATE OR REPLACE VIEW public.orders_summary AS
SELECT 
    o.id,
    o.order_number,
    o.created_at,
    o.total_amount,
    o.order_status,
    o.payment_status,
    c.email,
    c.first_name || ' ' || c.last_name as customer_name,
    COUNT(DISTINCT oi.id) as unique_items_count,
    SUM(oi.quantity) as total_items_quantity,
    COUNT(DISTINCT CASE WHEN oi.item_type = 'photo' THEN oi.id END) as photos_count,
    COUNT(DISTINCT CASE WHEN oi.item_type = 'frame' THEN oi.id END) as frames_count
FROM public.orders o
LEFT JOIN public.customers c ON o.customer_id = c.id
LEFT JOIN public.order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.created_at, o.total_amount, 
         o.order_status, o.payment_status, c.email, c.first_name, c.last_name;

-- =========================================
-- 5. FONCTION POUR CALCULER LE HASH DU CONTENU
-- =========================================

-- Fonction pour générer un hash unique basé sur le contenu
CREATE OR REPLACE FUNCTION generate_content_hash(
    p_photo_url TEXT,
    p_video_url TEXT,
    p_message TEXT,
    p_signature TEXT,
    p_format VARCHAR,
    p_with_frame BOOLEAN
) RETURNS VARCHAR AS $$
BEGIN
    RETURN MD5(
        COALESCE(p_photo_url, '') || '|' ||
        COALESCE(p_video_url, '') || '|' ||
        COALESCE(p_message, '') || '|' ||
        COALESCE(p_signature, '') || '|' ||
        COALESCE(p_format, '') || '|' ||
        COALESCE(p_with_frame::TEXT, 'false')
    );
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 6. TRIGGER POUR UPDATED_AT
-- =========================================

-- Créer un trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger aux tables
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON public.customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON public.orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- 7. NETTOYAGE ET VALIDATION
-- =========================================

-- Vérifier la structure après modifications
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name IN ('customers', 'orders', 'order_items')
ORDER BY table_name, ordinal_position;

-- =========================================
-- NOTES IMPORTANTES
-- =========================================
-- 1. Exécuter ce script dans Supabase SQL Editor
-- 2. Les colonnes avec IF NOT EXISTS ne seront créées que si elles n'existent pas
-- 3. Les index amélioreront les performances des requêtes
-- 4. La fonction content_hash permet de détecter les items identiques
-- 5. La vue orders_summary facilite l'affichage des commandes