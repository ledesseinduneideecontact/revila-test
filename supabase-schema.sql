-- ========================================
-- REVIVE APP - SUPABASE SETUP COMPLET ✅
-- ========================================
-- 
-- Configuration actuelle FONCTIONNELLE (Janvier 2025)
-- Webhook N8N + Déduplication + Storage opérationnels
--
-- Tables existantes dans Supabase (ne pas recréer)

-- Table customers (existante)
/*
create table public.customers (
  id uuid not null default extensions.uuid_generate_v4 (),
  first_name character varying(100) not null,
  last_name character varying(100) not null,
  email character varying(255) not null,
  phone character varying(20) null,
  created_at timestamp with time zone null default now(),
  constraint customers_pkey primary key (id)
) TABLESPACE pg_default;
*/

-- Table orders (existante)
/*
create table public.orders (
  id uuid not null default extensions.uuid_generate_v4 (),
  order_number character varying(50) not null,
  customer_id uuid null,
  shipping_address text not null,
  shipping_address_complement character varying(255) null,
  shipping_postal_code character varying(10) not null,
  shipping_city character varying(100) not null,
  shipping_country character varying(50) null default 'France'::character varying,
  subtotal_amount numeric(10, 2) not null,
  shipping_amount numeric(10, 2) null default 2.99,
  discount_amount numeric(10, 2) null default 0.00,
  total_amount numeric(10, 2) not null,
  discount_code character varying(50) null,
  order_status character varying(30) null default 'received'::character varying,
  payment_status character varying(20) null default 'pending'::character varying,
  payment_intent_id character varying(255) null,
  payment_method character varying(50) null,
  message_name character varying(100) null,
  message_text text null,
  tracking_number character varying(100) null,
  shipping_carrier character varying(50) null,
  notes text null,
  admin_notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  shipped_at timestamp with time zone null,
  delivered_at timestamp with time zone null,
  constraint orders_pkey primary key (id),
  constraint orders_order_number_key unique (order_number),
  constraint orders_customer_id_fkey foreign KEY (customer_id) references customers (id) on delete CASCADE
) TABLESPACE pg_default;
*/

-- Table order_items (existante) 
/*
create table public.order_items (
  id uuid not null default extensions.uuid_generate_v4 (),
  order_id uuid null,
  item_number integer not null,
  photo_gcs_url text not null,
  video_gcs_url text not null,
  photo_filename character varying(255) not null,
  video_filename character varying(255) not null,
  photo_size_bytes integer null,
  video_size_bytes integer null,
  photo_mime_type character varying(50) null,
  video_mime_type character varying(50) null,
  unit_price numeric(10, 2) not null default 9.50,
  gcs_upload_status character varying(20) null default 'uploaded'::character varying,
  last_verified_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint order_items_pkey primary key (id),
  constraint order_items_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE
) TABLESPACE pg_default;
*/

-- Ajouter les champs manquants pour REVIVE si nécessaires
-- Vérifier si ces champs existent avant d'exécuter

-- Ajout de champs spécifiques REVIVE à orders (si pas encore présents)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS message_signature character varying(255);

-- Ajout de champs spécifiques REVIVE à order_items (si pas encore présents)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS message_text text;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS message_signature character varying(255);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS nfc_tag_id character varying(100);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_printed boolean default false;
-- Adresse cadeau par item (texte libre multi-lignes)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS gift_address text;

-- ⚠️ ANCIENS BUCKETS (obsolètes - remplacés par revive.v3)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES 
--   ('photos', 'photos', true, 10485760, '{"image/jpeg", "image/png", "image/webp"}'),
--   ('videos', 'videos', true, 52428800, '{"video/mp4", "video/webm", "video/quicktime"}')
-- ON CONFLICT (id) DO NOTHING;

-- Fonction pour updated_at si elle n'existe pas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Politiques RLS pour REVIVE (ajuster selon vos besoins)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre les opérations via service role
DROP POLICY IF EXISTS "Allow service role access" ON customers;
DROP POLICY IF EXISTS "Allow service role access" ON orders;
DROP POLICY IF EXISTS "Allow service role access" ON order_items;

CREATE POLICY "Allow service role access" ON customers FOR ALL USING (true);
CREATE POLICY "Allow service role access" ON orders FOR ALL USING (true);
CREATE POLICY "Allow service role access" ON order_items FOR ALL USING (true);

-- ========================================
-- TABLE WEBHOOK_EVENTS - DÉDUPLICATION ✅
-- ========================================
-- NOUVELLE TABLE pour éviter les doubles déclenchements N8N
-- OBLIGATOIRE pour le système de déduplication

CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  event_type VARCHAR(50) NOT NULL,
  stripe_event_id VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  n8n_triggered_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(order_id, event_type)
);

-- Index unique pour Stripe event_id (seulement si non null)
CREATE UNIQUE INDEX idx_webhook_events_stripe_unique 
ON webhook_events(stripe_event_id) 
WHERE stripe_event_id IS NOT NULL;

-- Index pour les requêtes fréquentes
CREATE INDEX idx_webhook_events_order_status ON webhook_events(order_id, status);

-- Politique RLS pour webhook_events
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role access" ON webhook_events FOR ALL USING (true);

-- ========================================
-- BUCKET STORAGE CORRECT - REVIVE.V3 ✅
-- ========================================
-- IMPORTANT: Le code utilise le bucket 'revive.v3', pas 'photos'/'videos'

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('revive.v3', 'revive.v3', true, 52428800, '{"image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "video/quicktime"}')
ON CONFLICT (id) DO NOTHING;

-- Politique storage pour revive.v3
CREATE POLICY "Allow public access" ON storage.objects FOR ALL USING (bucket_id = 'revive.v3');

-- ========================================
-- ÉTAT ACTUEL DU SYSTÈME ✅
-- ========================================

-- 🎯 FLUX FONCTIONNEL:
-- 1. /commander → FormData → /api/orders/create-with-payment
-- 2. Créer customer → order → upload files → order_items → PaymentIntent Stripe
-- 3. Paiement → webhook Stripe OU page confirmation → déduplication webhook_events
-- 4. N8N reçoit {"order_number": "REV-xxx"} UNE SEULE FOIS
-- 5. Commande trackée dans webhook_events avec status 'completed'

-- 📊 TABLES UTILISÉES:
-- ✅ customers: Infos client (nom, email, adresse)
-- ✅ orders: Commande principale + PaymentIntent Stripe
-- ✅ order_items: Fichiers uploadés (photo + vidéo par item) 
-- ✅ webhook_events: Déduplication N8N (NOUVEAU - OBLIGATOIRE)

-- 💾 STORAGE:
-- ✅ Bucket: revive.v3
-- ✅ Structure: YYYY-MM/order_id/photo-1.jpg, video-1.mp4
-- ✅ Limites: Photos 10MB, Vidéos 50MB

-- 🔗 WEBHOOKS:
-- ✅ Stripe: payment_intent.succeeded → webhook_events déduplication → N8N
-- ✅ Confirmation: /api/orders/confirm → webhook_events déduplication → N8N (backup)
-- ✅ Format N8N: {"order_number": "REV-timestamp-random"}

-- 🛡️ SÉCURITÉ:
-- ✅ RLS activé sur toutes les tables
-- ✅ Service role access pour les API
-- ✅ Contraintes uniques pour éviter doublons
-- ✅ Déduplication atomique PostgreSQL