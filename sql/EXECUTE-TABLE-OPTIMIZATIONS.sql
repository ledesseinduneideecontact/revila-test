-- =========================================
-- SCRIPT COMPLET D'OPTIMISATION TABLES REVILA
-- =========================================
-- Exécuter ce script dans Supabase SQL Editor
-- Il combine toutes les optimisations nécessaires

-- =========================================
-- ÉTAPE 1 : AJOUTER COLONNES MANQUANTES À CUSTOMERS
-- =========================================

ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(50) DEFAULT 'France';

-- =========================================
-- ÉTAPE 2 : OPTIMISER ORDER_ITEMS
-- =========================================

-- Ajouter les nouvelles colonnes essentielles
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS item_type VARCHAR(20) DEFAULT 'photo',
ADD COLUMN IF NOT EXISTS with_frame BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS format VARCHAR(20),
ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64),
ADD COLUMN IF NOT EXISTS photo_width INTEGER,
ADD COLUMN IF NOT EXISTS photo_height INTEGER;

-- Renommer les colonnes pour plus de clarté (si elles existent)
DO $$ 
BEGIN
    -- Renommer photo_gcs_url vers photo_googlecloud_url
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'order_items' 
               AND column_name = 'photo_gcs_url') THEN
        ALTER TABLE public.order_items RENAME COLUMN photo_gcs_url TO photo_googlecloud_url;
    END IF;
    
    -- Renommer video_gcs_url vers video_googlecloud_url
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'order_items' 
               AND column_name = 'video_gcs_url') THEN
        ALTER TABLE public.order_items RENAME COLUMN video_gcs_url TO video_googlecloud_url;
    END IF;
END $$;

-- Ajouter les colonnes renommées si elles n'existent pas
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS photo_googlecloud_url VARCHAR,
ADD COLUMN IF NOT EXISTS video_googlecloud_url VARCHAR;

-- Gérer les colonnes de taille de fichiers
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS photo_file_size INTEGER,
ADD COLUMN IF NOT EXISTS video_file_size INTEGER;

-- Migrer les données des anciennes colonnes si elles existent
DO $$ 
BEGIN
    -- Migrer photo_size_bytes vers photo_file_size
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'order_items' 
               AND column_name = 'photo_size_bytes') THEN
        UPDATE public.order_items 
        SET photo_file_size = photo_size_bytes
        WHERE photo_file_size IS NULL AND photo_size_bytes IS NOT NULL;
    END IF;
    
    -- Migrer video_size_bytes vers video_file_size
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'order_items' 
               AND column_name = 'video_size_bytes') THEN
        UPDATE public.order_items 
        SET video_file_size = video_size_bytes
        WHERE video_file_size IS NULL AND video_size_bytes IS NOT NULL;
    END IF;
END $$;

-- Modifier le type de item_number si c'est un VARCHAR
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'item_number'
        AND data_type = 'character varying'
    ) THEN
        ALTER TABLE public.order_items 
        ALTER COLUMN item_number TYPE INTEGER USING item_number::INTEGER;
    END IF;
END $$;

-- =========================================
-- ÉTAPE 3 : NETTOYER LA TABLE ORDERS
-- =========================================

-- Ajouter payment_intent_id si elle n'existe pas
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255);

-- Migrer les données de stripe_payment_intent_id vers payment_intent_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' 
               AND column_name = 'stripe_payment_intent_id') THEN
        UPDATE public.orders 
        SET payment_intent_id = stripe_payment_intent_id 
        WHERE payment_intent_id IS NULL AND stripe_payment_intent_id IS NOT NULL;
    END IF;
END $$;

-- Supprimer les colonnes inutiles de orders
ALTER TABLE public.orders 
DROP COLUMN IF EXISTS shipping_address_coordinates,
DROP COLUMN IF EXISTS payment_method,
DROP COLUMN IF EXISTS message_name,
DROP COLUMN IF EXISTS message_text,
DROP COLUMN IF EXISTS message_signature,
DROP COLUMN IF EXISTS notes,
DROP COLUMN IF EXISTS saved_cart_id,
DROP COLUMN IF EXISTS stripe_payment_intent_id;

-- =========================================
-- ÉTAPE 4 : METTRE À JOUR LA COLONNE CATEGORIE
-- =========================================

-- Fonction pour générer la catégorie
CREATE OR REPLACE FUNCTION generate_item_category(
    p_item_type VARCHAR,
    p_format VARCHAR
) RETURNS VARCHAR AS $$
BEGIN
    IF p_item_type = 'frame' THEN
        RETURN 'cadre-' || COALESCE(p_format, 'standard');
    ELSE
        RETURN 'photo-' || COALESCE(p_format, '10x15');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Mettre à jour les catégories existantes
UPDATE public.order_items
SET categorie = generate_item_category(
    COALESCE(item_type, 'photo'),
    COALESCE(format, CASE 
        WHEN categorie LIKE 'photo-%' THEN REPLACE(categorie, 'photo-', '')
        WHEN categorie LIKE 'cadre-%' THEN REPLACE(categorie, 'cadre-', '')
        ELSE '10x15'
    END)
)
WHERE categorie IS NULL OR categorie = '';

-- =========================================
-- ÉTAPE 5 : CRÉER LES INDEX POUR PERFORMANCES
-- =========================================

-- Index pour customers
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);

-- Index pour orders
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id ON public.orders(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- Index pour order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_content_hash ON public.order_items(content_hash);
CREATE INDEX IF NOT EXISTS idx_order_items_item_type ON public.order_items(item_type);
CREATE INDEX IF NOT EXISTS idx_order_items_categorie ON public.order_items(categorie);

-- =========================================
-- ÉTAPE 6 : CRÉER LA VUE ADMIN
-- =========================================

DROP VIEW IF EXISTS public.admin_orders_view;
CREATE VIEW public.admin_orders_view AS
SELECT 
    o.id,
    o.order_number,
    o.created_at,
    o.total_amount,
    o.order_status,
    o.payment_status,
    o.payment_intent_id,
    o.tracking_number,
    c.email,
    c.first_name || ' ' || c.last_name as customer_name,
    c.phone,
    COALESCE(o.shipping_address, c.address) as delivery_address,
    COALESCE(o.shipping_postal_code, c.postal_code) as delivery_postal_code,
    COALESCE(o.shipping_city, c.city) as delivery_city,
    COUNT(DISTINCT oi.id) as unique_items,
    SUM(oi.quantity) as total_quantity,
    STRING_AGG(DISTINCT oi.categorie, ', ' ORDER BY oi.categorie) as item_categories
FROM public.orders o
LEFT JOIN public.customers c ON o.customer_id = c.id
LEFT JOIN public.order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.created_at, o.total_amount, 
         o.order_status, o.payment_status, o.payment_intent_id,
         o.tracking_number, o.shipping_address, o.shipping_postal_code,
         o.shipping_city, c.email, c.first_name, c.last_name, c.phone,
         c.address, c.postal_code, c.city;

-- =========================================
-- ÉTAPE 7 : FONCTION POUR HASH DE CONTENU
-- =========================================

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
-- ÉTAPE 8 : TRIGGER POUR UPDATED_AT
-- =========================================

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
-- ÉTAPE 9 : CONTRAINTES DE VALIDATION
-- =========================================

-- Ajouter une contrainte pour valider item_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_item_type'
    ) THEN
        ALTER TABLE public.order_items
        ADD CONSTRAINT check_item_type CHECK (item_type IN ('photo', 'frame'));
    END IF;
END $$;

-- =========================================
-- ÉTAPE 10 : SUPPRIMER LES ANCIENNES COLONNES
-- =========================================

-- Supprimer les anciennes colonnes après migration (optionnel)
-- Décommentez ces lignes seulement après avoir vérifié que tout fonctionne

-- ALTER TABLE public.order_items
-- DROP COLUMN IF EXISTS photo_size_bytes,
-- DROP COLUMN IF EXISTS video_size_bytes,
-- DROP COLUMN IF EXISTS format,
-- DROP COLUMN IF EXISTS frame_size;

-- =========================================
-- VÉRIFICATION FINALE
-- =========================================

-- Afficher la structure des tables après modifications
SELECT 
    'STRUCTURE FINALE DES TABLES' as info;

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

-- Afficher les index créés
SELECT 
    'INDEX CRÉÉS' as info;

SELECT 
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('customers', 'orders', 'order_items')
ORDER BY tablename, indexname;

-- =========================================
-- FIN DU SCRIPT
-- =========================================
-- 
-- Après exécution :
-- 1. Vérifiez que toutes les colonnes sont créées
-- 2. Testez la nouvelle API : /api/orders/create-with-payment-optimized
-- 3. Les anciennes API continueront de fonctionner
-- 
-- REVILA APP - Tables optimisées ✅