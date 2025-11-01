-- ============================================================
-- REVIVE - Système d'Authentification et Sauvegarde de Paniers
-- ============================================================
-- Ce script crée les tables nécessaires pour :
-- 1. Les profils utilisateurs
-- 2. Les paniers sauvegardés
-- 3. Les items de panier sauvegardés
-- 4. Met à jour la table customers existante
-- ============================================================

-- 1. TABLE PROFILS UTILISATEURS
-- Liée à auth.users de Supabase Auth
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'FR',
  newsletter_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- 2. TABLE PANIERS SAUVEGARDÉS
CREATE TABLE IF NOT EXISTS saved_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  cart_name TEXT DEFAULT 'Panier sauvegardé',
  current_step INTEGER DEFAULT 1,
  -- État du wizard (1=format, 2=upload, 3=gallery, etc.)
  cart_data JSONB, -- Données additionnelles si nécessaire
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_saved_carts_user_id ON saved_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_carts_expires_at ON saved_carts(expires_at);
CREATE INDEX IF NOT EXISTS idx_saved_carts_updated_at ON saved_carts(updated_at DESC);

-- 3. TABLE ITEMS DU PANIER SAUVEGARDÉ
CREATE TABLE IF NOT EXISTS saved_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES saved_carts(id) ON DELETE CASCADE,
  
  -- Format et options
  format TEXT NOT NULL CHECK (format IN ('carre', '10x15', '20x30', '30x45')),
  with_frame BOOLEAN DEFAULT false,
  
  -- Fichiers (URLs dans Supabase Storage)
  photo_url TEXT,
  photo_original_name TEXT,
  photo_size INTEGER, -- en bytes
  video_url TEXT,
  video_original_name TEXT,
  video_size INTEGER, -- en bytes
  
  -- Personnalisation
  message TEXT,
  signature TEXT,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  
  -- Options cadeau
  is_gift BOOLEAN DEFAULT false,
  gift_first_name TEXT,
  gift_last_name TEXT,
  gift_address TEXT,
  gift_postal_code TEXT,
  gift_city TEXT,
  
  -- Ordre et métadonnées
  position INTEGER, -- ordre dans le panier
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_saved_cart_items_cart_id ON saved_cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_saved_cart_items_position ON saved_cart_items(cart_id, position);

-- 4. MODIFICATION DE LA TABLE CUSTOMERS EXISTANTE
-- Ajouter le lien avec les comptes utilisateurs
DO $$
BEGIN
  -- Vérifier si les colonnes existent déjà
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'customers' AND column_name = 'user_id') THEN
    ALTER TABLE customers ADD COLUMN user_id UUID REFERENCES user_profiles(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'customers' AND column_name = 'is_guest') THEN
    ALTER TABLE customers ADD COLUMN is_guest BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Index pour la table customers
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

-- 5. TABLE DE PARTAGE DE PANIER (Fonctionnalité bonus)
CREATE TABLE IF NOT EXISTS cart_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES saved_carts(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_shares_token ON cart_shares(share_token);

-- 6. TABLE DE SESSIONS DE RÉCUPÉRATION (pour les paniers abandonnés)
CREATE TABLE IF NOT EXISTS cart_recovery_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES saved_carts(id) ON DELETE CASCADE,
  recovery_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  email_sent_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS POUR MISE À JOUR AUTOMATIQUE DES TIMESTAMPS
-- ============================================================

-- Fonction helper pour update_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_carts_updated_at ON saved_carts;
CREATE TRIGGER update_saved_carts_updated_at
  BEFORE UPDATE ON saved_carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_cart_items_updated_at ON saved_cart_items;
CREATE TRIGGER update_saved_cart_items_updated_at
  BEFORE UPDATE ON saved_cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TRIGGER POUR CRÉER AUTOMATIQUEMENT UN PROFIL UTILISATEUR
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Activer RLS sur toutes les tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_recovery_sessions ENABLE ROW LEVEL SECURITY;

-- Policies pour user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Policies pour saved_carts
DROP POLICY IF EXISTS "Users can view own saved carts" ON saved_carts;
CREATE POLICY "Users can view own saved carts" 
  ON saved_carts FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own saved carts" ON saved_carts;
CREATE POLICY "Users can create own saved carts" 
  ON saved_carts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own saved carts" ON saved_carts;
CREATE POLICY "Users can update own saved carts" 
  ON saved_carts FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved carts" ON saved_carts;
CREATE POLICY "Users can delete own saved carts" 
  ON saved_carts FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies pour saved_cart_items
DROP POLICY IF EXISTS "Users can view own cart items" ON saved_cart_items;
CREATE POLICY "Users can view own cart items" 
  ON saved_cart_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM saved_carts 
      WHERE saved_carts.id = saved_cart_items.cart_id 
      AND saved_carts.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage own cart items" ON saved_cart_items;
CREATE POLICY "Users can manage own cart items" 
  ON saved_cart_items FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM saved_carts 
      WHERE saved_carts.id = saved_cart_items.cart_id 
      AND saved_carts.user_id = auth.uid()
    )
  );

-- Policies pour cart_shares (lecture publique avec token)
DROP POLICY IF EXISTS "Anyone can view shared cart with valid token" ON cart_shares;
CREATE POLICY "Anyone can view shared cart with valid token" 
  ON cart_shares FOR SELECT 
  USING (true); -- La validation du token se fait côté application

DROP POLICY IF EXISTS "Users can create shares for own carts" ON cart_shares;
CREATE POLICY "Users can create shares for own carts" 
  ON cart_shares FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM saved_carts 
      WHERE saved_carts.id = cart_shares.cart_id 
      AND saved_carts.user_id = auth.uid()
    )
  );

-- ============================================================
-- FONCTION DE NETTOYAGE DES PANIERS EXPIRÉS
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_expired_carts()
RETURNS void AS $$
BEGIN
  -- Supprimer les paniers expirés
  DELETE FROM saved_carts 
  WHERE expires_at < NOW() 
  AND is_active = true;
  
  -- Supprimer les partages expirés
  DELETE FROM cart_shares 
  WHERE expires_at < NOW();
  
  -- Supprimer les sessions de récupération expirées
  DELETE FROM cart_recovery_sessions 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Créer une tâche planifiée (à configurer dans Supabase Dashboard ou via cron)
-- SELECT cron.schedule('cleanup-expired-carts', '0 2 * * *', 'SELECT cleanup_expired_carts();');

-- ============================================================
-- DONNÉES DE TEST (Optionnel - À commenter en production)
-- ============================================================

-- INSERT INTO user_profiles (id, email, first_name, last_name)
-- VALUES 
--   ('11111111-1111-1111-1111-111111111111'::uuid, 'test@example.com', 'Jean', 'Dupont');

-- ============================================================
-- VUES UTILES POUR L'ADMINISTRATION
-- ============================================================

-- Vue pour voir les paniers actifs avec leurs stats
CREATE OR REPLACE VIEW active_carts_stats AS
SELECT 
  sc.id,
  sc.user_id,
  up.email,
  sc.current_step,
  sc.created_at,
  sc.updated_at,
  sc.expires_at,
  COUNT(sci.id) as item_count,
  SUM(sci.quantity) as total_quantity
FROM saved_carts sc
LEFT JOIN user_profiles up ON sc.user_id = up.id
LEFT JOIN saved_cart_items sci ON sc.id = sci.cart_id
WHERE sc.is_active = true
GROUP BY sc.id, sc.user_id, up.email, sc.current_step, 
         sc.created_at, sc.updated_at, sc.expires_at;

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================