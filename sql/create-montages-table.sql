-- ========================================
-- MONTAGES TABLE - VIDEO MONTAGE FEATURE
-- ========================================
--
-- Table pour gérer les montages vidéo automatiques
-- Utilise Shotstack API pour le rendu vidéo
--
-- Flux:
-- 1. Utilisateur upload photos/vidéos
-- 2. Montage créé avec status 'pending'
-- 3. API Shotstack traite le montage
-- 4. Status mis à jour: 'processing' → 'completed' ou 'failed'
-- 5. URL finale stockée dans final_video_gcs_url
--

CREATE TABLE IF NOT EXISTS public.montages (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  order_item_id uuid NULL REFERENCES order_items(id) ON DELETE CASCADE,

  -- Media files (photos et vidéos dans l'ordre de montage)
  media_files jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Format: [{"type": "photo|video", "gcs_url": "...", "duration_seconds": 2, "order": 0}]

  -- Music configuration
  music_track_id varchar(100) NULL,
  music_gcs_url text NULL,
  music_volume numeric(3, 2) DEFAULT 0.5, -- 0.0 à 1.0

  -- Shotstack processing
  shotstack_render_id varchar(100) NULL,
  shotstack_status varchar(50) DEFAULT 'pending', -- pending, processing, completed, failed
  shotstack_progress integer DEFAULT 0, -- 0-100
  shotstack_error_message text NULL,

  -- Final video
  final_video_gcs_url text NULL,
  final_video_filename varchar(255) NULL,
  final_video_size_bytes integer NULL,
  final_video_duration_seconds numeric(10, 2) NULL,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  processing_started_at timestamp with time zone NULL,
  processing_completed_at timestamp with time zone NULL,

  CONSTRAINT montages_pkey PRIMARY KEY (id),
  CONSTRAINT montages_shotstack_render_id_key UNIQUE (shotstack_render_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_montages_order_item ON montages(order_item_id);
CREATE INDEX IF NOT EXISTS idx_montages_status ON montages(shotstack_status);
CREATE INDEX IF NOT EXISTS idx_montages_render_id ON montages(shotstack_render_id) WHERE shotstack_render_id IS NOT NULL;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_montages_updated_at ON montages;
CREATE TRIGGER update_montages_updated_at
  BEFORE UPDATE ON montages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE montages ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre les opérations via service role
DROP POLICY IF EXISTS "Allow service role access" ON montages;
CREATE POLICY "Allow service role access" ON montages FOR ALL USING (true);

-- ========================================
-- MUSIC TRACKS TABLE (Optionnel)
-- ========================================
-- Table pour stocker les pistes musicales disponibles
-- À implémenter plus tard si besoin

CREATE TABLE IF NOT EXISTS public.music_tracks (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  title varchar(255) NOT NULL,
  artist varchar(255) NULL,
  gcs_url text NOT NULL,
  duration_seconds numeric(10, 2) NOT NULL,
  genre varchar(100) NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),

  CONSTRAINT music_tracks_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_music_tracks_active ON music_tracks(is_active);

ALTER TABLE music_tracks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow service role access" ON music_tracks;
CREATE POLICY "Allow service role access" ON music_tracks FOR ALL USING (true);

-- Insérer quelques pistes de musique de démonstration (liens vers des musiques libres de droits)
INSERT INTO music_tracks (title, artist, gcs_url, duration_seconds, genre) VALUES
('Aucune musique', 'N/A', '', 0, 'none'),
('Happy Acoustic', 'Free Music', 'https://www.bensound.com/bensound-music/bensound-happyrock.mp3', 90, 'upbeat'),
('Relaxing Piano', 'Free Music', 'https://www.bensound.com/bensound-music/bensound-dreams.mp3', 120, 'calm')
ON CONFLICT DO NOTHING;
