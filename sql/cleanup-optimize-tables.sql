-- =========================================
-- NETTOYAGE ET OPTIMISATION DES TABLES REVILA
-- =========================================
-- Script pour nettoyer les colonnes inutiles et renommer
-- Exécuter APRÈS optimize-tables-structure.sql

-- =========================================
-- 1. NETTOYER TABLE ORDERS
-- =========================================

-- Supprimer les colonnes inutiles ou redondantes
ALTER TABLE public.orders 
DROP COLUMN IF EXISTS shipping_address_coordinates, -- Inutile, on a déjà l'adresse
DROP COLUMN IF EXISTS payment_method, -- Toujours Stripe
DROP COLUMN IF EXISTS message_name, -- Superflu, dans order_items
DROP COLUMN IF EXISTS message_text, -- Superflu, dans order_items  
DROP COLUMN IF EXISTS message_signature, -- Superflu, dans order_items
DROP COLUMN IF EXISTS admin_notes, -- Peut être utile, à garder selon votre usage
DROP COLUMN IF EXISTS notes, -- Redondant avec admin_notes
DROP COLUMN IF EXISTS saved_cart_id; -- Si vous n'utilisez pas les paniers sauvegardés

-- Garder payment_intent_id mais supprimer stripe_payment_intent_id (doublon)
ALTER TABLE public.orders
DROP COLUMN IF EXISTS stripe_payment_intent_id;

-- S'assurer que payment_intent_id existe
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255);

-- =========================================
-- 2. OPTIMISER TABLE ORDER_ITEMS
-- =========================================

-- Renommer les colonnes pour plus de clarté
ALTER TABLE public.order_items 
RENAME COLUMN photo_gcs_url TO supabase_url;

ALTER TABLE public.order_items
RENAME COLUMN video_gcs_url TO google_cloud_url;

-- Renommer les colonnes de taille
ALTER TABLE public.order_items
DROP COLUMN IF EXISTS photo_size_bytes,
DROP COLUMN IF EXISTS video_size_bytes,
ADD COLUMN IF NOT EXISTS photo_file_size INTEGER,
ADD COLUMN IF NOT EXISTS video_file_size INTEGER;

-- Ajouter dimensions photo si possible (à calculer côté application)
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS photo_width INTEGER,
ADD COLUMN IF NOT EXISTS photo_height INTEGER;

-- Mettre à jour la colonne categorie pour être plus claire
-- Cette colonne contiendra : 'photo-10x15', 'photo-20x30', 'cadre-10x15', etc.
ALTER TABLE public.order_items
ALTER COLUMN categorie TYPE VARCHAR(30);

-- Supprimer la colonne format si on utilise categorie
-- (garder une seule source de vérité)
ALTER TABLE public.order_items
DROP COLUMN IF EXISTS format,
DROP COLUMN IF EXISTS frame_size;

-- =========================================
-- 3. FONCTION POUR GÉNÉRER LA CATÉGORIE
-- =========================================

-- Fonction helper pour générer la catégorie à partir du type et format
CREATE OR REPLACE FUNCTION generate_item_category(
    p_item_type VARCHAR,
    p_format VARCHAR
) RETURNS VARCHAR AS $$
BEGIN
    IF p_item_type = 'frame' THEN
        RETURN 'cadre-' || p_format;
    ELSE
        RETURN 'photo-' || p_format;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 4. MIGRATION DES DONNÉES EXISTANTES
-- =========================================

-- Migrer les données existantes vers le nouveau format
-- (à exécuter seulement si vous avez déjà des données)

-- Mettre à jour supabase_url et google_cloud_url si les anciennes colonnes existent
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'order_items' 
               AND column_name = 'photo_gcs_url') THEN
        UPDATE public.order_items 
        SET supabase_url = photo_gcs_url
        WHERE supabase_url IS NULL AND photo_gcs_url IS NOT NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'order_items' 
               AND column_name = 'video_gcs_url') THEN
        UPDATE public.order_items 
        SET google_cloud_url = video_gcs_url
        WHERE google_cloud_url IS NULL AND video_gcs_url IS NOT NULL;
    END IF;
END $$;

-- Mettre à jour les tailles de fichiers
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'order_items' 
               AND column_name = 'photo_size_bytes') THEN
        UPDATE public.order_items 
        SET photo_file_size = photo_size_bytes
        WHERE photo_file_size IS NULL AND photo_size_bytes IS NOT NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'order_items' 
               AND column_name = 'video_size_bytes') THEN
        UPDATE public.order_items 
        SET video_file_size = video_size_bytes
        WHERE video_file_size IS NULL AND video_size_bytes IS NOT NULL;
    END IF;
END $$;

-- Générer la catégorie basée sur item_type et format existants
UPDATE public.order_items
SET categorie = CASE 
    WHEN item_type = 'frame' AND format IS NOT NULL THEN 'cadre-' || format
    WHEN item_type = 'photo' AND format IS NOT NULL THEN 'photo-' || format
    WHEN item_type = 'photo' AND categorie LIKE 'photo-%' THEN categorie
    WHEN item_type = 'frame' AND categorie LIKE 'cadre-%' THEN categorie
    ELSE categorie
END
WHERE categorie IS NULL OR categorie = '';

-- =========================================
-- 5. NETTOYER LES ANCIENNES COLONNES
-- =========================================

-- Supprimer les anciennes colonnes après migration
ALTER TABLE public.order_items
DROP COLUMN IF EXISTS photo_gcs_url,
DROP COLUMN IF EXISTS video_gcs_url;

-- =========================================
-- 6. CONTRAINTES ET INDEX OPTIMISÉS
-- =========================================

-- Ajouter des contraintes pour assurer la cohérence
ALTER TABLE public.order_items
ADD CONSTRAINT check_item_type CHECK (item_type IN ('photo', 'frame'));

-- Index optimisés pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_order_items_categorie ON public.order_items(categorie);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- =========================================
-- 7. VUE SIMPLIFIÉE POUR L'ADMIN
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
    STRING_AGG(DISTINCT oi.categorie, ', ') as item_categories
FROM public.orders o
LEFT JOIN public.customers c ON o.customer_id = c.id
LEFT JOIN public.order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.created_at, o.total_amount, 
         o.order_status, o.payment_status, o.payment_intent_id,
         o.tracking_number, o.shipping_address, o.shipping_postal_code,
         o.shipping_city, c.email, c.first_name, c.last_name, c.phone,
         c.address, c.postal_code, c.city;

-- =========================================
-- 8. COLONNES FINALES RECOMMANDÉES
-- =========================================

/*
TABLE orders:
- id, order_number, customer_id
- shipping_address, shipping_postal_code, shipping_city, shipping_country
- subtotal_amount, shipping_amount, discount_amount, total_amount
- discount_code, order_status, payment_status
- payment_intent_id (Stripe)
- tracking_number, shipping_carrier
- admin_notes (optionnel, pour notes internes)
- created_at, updated_at, shipped_at, delivered_at

TABLE order_items:
- id, order_id, item_number
- item_type ('photo' ou 'frame')
- categorie ('photo-10x15', 'photo-20x30', 'cadre-10x15', etc.)
- quantity
- with_frame (pour les photos)
- supabase_url (stockage photo)
- google_cloud_url (stockage vidéo optionnel)
- photo_filename, video_filename
- photo_file_size, video_file_size
- photo_width, photo_height (dimensions en pixels)
- photo_mime_type, video_mime_type
- message_text, message_signature
- unit_price
- content_hash (pour déduplication)
- cadeau, nom, adresse, code_postal, ville (pour livraison cadeau)
- gcs_upload_status
- created_at

TABLE customers:
- id, user_id
- first_name, last_name, email, phone
- address, postal_code, city, country
- is_guest
- created_at, updated_at
*/

-- =========================================
-- VÉRIFICATION FINALE
-- =========================================

-- Afficher la structure finale des tables
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name IN ('customers', 'orders', 'order_items')
ORDER BY table_name, ordinal_position;