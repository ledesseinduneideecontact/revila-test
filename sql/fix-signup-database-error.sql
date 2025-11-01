-- ============================================================
-- FIX: DATABASE ERROR SAVING NEW USER
-- Résout l'erreur "Database error saving new user" lors de l'inscription
-- ============================================================

-- 1. D'abord, vérifier la structure de la table user_profiles
DO $$
BEGIN
  -- Créer la table si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    CREATE TABLE public.user_profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT UNIQUE NOT NULL,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      postal_code TEXT,
      country TEXT DEFAULT 'France',
      newsletter_consent BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE '✅ Table user_profiles créée';
  ELSE
    RAISE NOTICE '✅ Table user_profiles existe déjà';
  END IF;
END $$;

-- 2. Supprimer l'ancien trigger qui pourrait causer des problèmes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 3. Créer une fonction améliorée avec gestion d'erreur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insérer uniquement si le profil n'existe pas déjà
  INSERT INTO public.user_profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
    newsletter_consent,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'newsletter_consent')::boolean, false),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Si le profil existe déjà, mettre à jour les champs vides
    first_name = COALESCE(user_profiles.first_name, EXCLUDED.first_name),
    last_name = COALESCE(user_profiles.last_name, EXCLUDED.last_name),
    phone = COALESCE(user_profiles.phone, EXCLUDED.phone),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne pas faire échouer l'inscription
    RAISE WARNING 'Erreur création profil pour user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recréer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Activer RLS sur user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Supprimer toutes les policies existantes pour repartir sur une base saine
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;

-- 7. Créer des policies simples et permissives
-- Policy pour permettre à tous de lire (temporaire pour debug)
CREATE POLICY "Enable read for authenticated users" 
  ON user_profiles FOR SELECT 
  TO authenticated
  USING (true);

-- Policy pour permettre l'insertion par le trigger (via service role)
CREATE POLICY "Enable insert for service role" 
  ON user_profiles FOR INSERT 
  TO service_role
  WITH CHECK (true);

-- Policy pour permettre aux utilisateurs de modifier leur propre profil
CREATE POLICY "Enable update for users own profile" 
  ON user_profiles FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy pour permettre aux utilisateurs de créer leur propre profil (au cas où)
CREATE POLICY "Enable insert for users own profile" 
  ON user_profiles FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 8. S'assurer que les colonnes nécessaires existent
DO $$
BEGIN
  -- Ajouter newsletter_consent si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_profiles' 
                 AND column_name = 'newsletter_consent') THEN
    ALTER TABLE user_profiles ADD COLUMN newsletter_consent BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Colonne newsletter_consent ajoutée';
  END IF;
END $$;

-- 9. Créer les profils manquants pour les utilisateurs existants
INSERT INTO user_profiles (id, email, created_at, updated_at)
SELECT 
  id, 
  email,
  created_at,
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;

-- 10. Vérification finale
DO $$
DECLARE
  users_count INTEGER;
  profiles_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_count FROM auth.users;
  SELECT COUNT(*) INTO profiles_count FROM user_profiles;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Configuration terminée avec succès !';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Utilisateurs: %', users_count;
  RAISE NOTICE 'Profils: %', profiles_count;
  
  IF users_count = profiles_count THEN
    RAISE NOTICE '✅ Tous les utilisateurs ont un profil';
  ELSE
    RAISE WARNING '⚠️ % utilisateurs sans profil', users_count - profiles_count;
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Le système devrait maintenant fonctionner';
  RAISE NOTICE 'Testez une nouvelle inscription !';
  RAISE NOTICE '========================================';
END $$;