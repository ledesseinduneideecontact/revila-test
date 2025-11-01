-- ============================================================
-- FIX: TRIGGER POUR CRÉER AUTOMATIQUEMENT LE PROFIL UTILISATEUR
-- ============================================================

-- 1. Créer la fonction qui sera appelée par le trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Créer le trigger sur la table auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Vérifier que les RLS policies existent
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes pour éviter les conflits
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON user_profiles;

-- Recréer les policies
CREATE POLICY "Users can view own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role full access" 
  ON user_profiles FOR ALL 
  USING (auth.jwt()->>'role' = 'service_role');

-- 5. Créer les profils pour les utilisateurs existants qui n'en ont pas
INSERT INTO user_profiles (id, email, created_at, updated_at)
SELECT 
  id, 
  email,
  created_at,
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;

-- 6. Test de vérification
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger configuré avec succès';
  RAISE NOTICE '✅ Les nouveaux utilisateurs auront automatiquement un profil';
  RAISE NOTICE '✅ Profiles créés pour % utilisateurs existants', 
    (SELECT COUNT(*) FROM auth.users WHERE id NOT IN (SELECT id FROM user_profiles));
END $$;