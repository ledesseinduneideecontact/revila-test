-- ============================================================
-- CORRECTION DES PERMISSIONS RLS (Row Level Security)
-- ============================================================
-- Ce script active RLS et configure les permissions
-- pour que les utilisateurs connectés puissent sauvegarder leurs paniers
-- ============================================================

-- 1. ACTIVER RLS SUR TOUTES LES TABLES
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_cart_items ENABLE ROW LEVEL SECURITY;

-- 2. SUPPRIMER LES ANCIENNES POLICIES (si elles existent)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

DROP POLICY IF EXISTS "Users can view own carts" ON saved_carts;
DROP POLICY IF EXISTS "Users can create own carts" ON saved_carts;
DROP POLICY IF EXISTS "Users can update own carts" ON saved_carts;
DROP POLICY IF EXISTS "Users can delete own carts" ON saved_carts;

DROP POLICY IF EXISTS "Users can view cart items" ON saved_cart_items;
DROP POLICY IF EXISTS "Users can create cart items" ON saved_cart_items;
DROP POLICY IF EXISTS "Users can update cart items" ON saved_cart_items;
DROP POLICY IF EXISTS "Users can delete cart items" ON saved_cart_items;

-- 3. POLICIES POUR USER_PROFILES
-- Les utilisateurs peuvent voir leur profil
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Les utilisateurs peuvent créer leur profil
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Les utilisateurs peuvent modifier leur profil
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. POLICIES POUR SAVED_CARTS
-- Les utilisateurs peuvent voir leurs paniers
CREATE POLICY "Users can view own carts" ON saved_carts
  FOR SELECT USING (user_id = auth.uid());

-- Les utilisateurs peuvent créer des paniers
CREATE POLICY "Users can create own carts" ON saved_carts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Les utilisateurs peuvent modifier leurs paniers
CREATE POLICY "Users can update own carts" ON saved_carts
  FOR UPDATE USING (user_id = auth.uid());

-- Les utilisateurs peuvent supprimer leurs paniers
CREATE POLICY "Users can delete own carts" ON saved_carts
  FOR DELETE USING (user_id = auth.uid());

-- 5. POLICIES POUR SAVED_CART_ITEMS
-- Les utilisateurs peuvent voir les items de leurs paniers
CREATE POLICY "Users can view cart items" ON saved_cart_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM saved_carts 
      WHERE saved_carts.id = saved_cart_items.cart_id 
      AND saved_carts.user_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent créer des items dans leurs paniers
CREATE POLICY "Users can create cart items" ON saved_cart_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM saved_carts 
      WHERE saved_carts.id = saved_cart_items.cart_id 
      AND saved_carts.user_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent modifier les items de leurs paniers
CREATE POLICY "Users can update cart items" ON saved_cart_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM saved_carts 
      WHERE saved_carts.id = saved_cart_items.cart_id 
      AND saved_carts.user_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent supprimer les items de leurs paniers
CREATE POLICY "Users can delete cart items" ON saved_cart_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM saved_carts 
      WHERE saved_carts.id = saved_cart_items.cart_id 
      AND saved_carts.user_id = auth.uid()
    )
  );

-- 6. TRIGGER POUR AUTO-CRÉER LE PROFIL UTILISATEUR
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, first_name, last_name, phone)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(user_profiles.first_name, EXCLUDED.first_name),
    last_name = COALESCE(user_profiles.last_name, EXCLUDED.last_name),
    phone = COALESCE(user_profiles.phone, EXCLUDED.phone),
    updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. VÉRIFICATION
DO $$
BEGIN
  RAISE NOTICE '✅ Permissions RLS configurées avec succès';
  RAISE NOTICE '✅ Les utilisateurs peuvent maintenant sauvegarder leurs paniers';
  RAISE NOTICE '📝 N''oubliez pas de vous connecter pour tester la sauvegarde';
END $$;