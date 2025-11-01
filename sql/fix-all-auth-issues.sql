-- ============================================================
-- FIX COMPLET: TOUS LES PROBLÈMES D'AUTHENTIFICATION
-- Résout toutes les erreurs liées à l'inscription et aux triggers
-- ============================================================

-- ÉTAPE 1: Désactiver temporairement tous les triggers problématiques
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS link_customer_on_signup ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.link_existing_customer_to_user() CASCADE;

-- ÉTAPE 2: Vérifier et corriger la table customers
-- ============================================================
DO $$
BEGIN
  -- Vérifier si la table customers existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    -- Ajouter updated_at si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'updated_at') THEN
      ALTER TABLE customers ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
      RAISE NOTICE '✅ Colonne updated_at ajoutée à customers';
    END IF;
    
    -- Ajouter user_id si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'user_id') THEN
      ALTER TABLE customers ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      RAISE NOTICE '✅ Colonne user_id ajoutée à customers';
    END IF;
    
    -- Ajouter is_guest si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'is_guest') THEN
      ALTER TABLE customers ADD COLUMN is_guest BOOLEAN DEFAULT true;
      RAISE NOTICE '✅ Colonne is_guest ajoutée à customers';
    END IF;
  END IF;
END $$;

-- ÉTAPE 3: Créer/Vérifier la table user_profiles
-- ============================================================
DO $$
BEGIN
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
    -- Ajouter les colonnes manquantes si nécessaire
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'newsletter_consent') THEN
      ALTER TABLE user_profiles ADD COLUMN newsletter_consent BOOLEAN DEFAULT false;
      RAISE NOTICE '✅ Colonne newsletter_consent ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'updated_at') THEN
      ALTER TABLE user_profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
      RAISE NOTICE '✅ Colonne updated_at ajoutée à user_profiles';
    END IF;
  END IF;
END $$;

-- ÉTAPE 4: Créer la fonction handle_new_user SÉCURISÉE
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  customer_exists BOOLEAN;
BEGIN
  -- 1. Créer le profil utilisateur
  BEGIN
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
      first_name = COALESCE(user_profiles.first_name, EXCLUDED.first_name),
      last_name = COALESCE(user_profiles.last_name, EXCLUDED.last_name),
      phone = COALESCE(user_profiles.phone, EXCLUDED.phone),
      newsletter_consent = COALESCE(user_profiles.newsletter_consent, EXCLUDED.newsletter_consent),
      updated_at = NOW();
    
    RAISE NOTICE '✅ Profil créé/mis à jour pour user %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Erreur création profil: %. Inscription continue.', SQLERRM;
  END;
  
  -- 2. Lier à un customer existant si la table existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    BEGIN
      -- Vérifier si un customer existe avec cet email
      SELECT EXISTS(
        SELECT 1 FROM customers 
        WHERE email = NEW.email AND user_id IS NULL
      ) INTO customer_exists;
      
      IF customer_exists THEN
        -- Mettre à jour le customer existant
        UPDATE customers 
        SET 
          user_id = NEW.id,
          is_guest = false,
          updated_at = CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'customers' AND column_name = 'updated_at')
            THEN NOW()
            ELSE updated_at
          END
        WHERE email = NEW.email AND user_id IS NULL;
        
        RAISE NOTICE '✅ Customer existant lié au user %', NEW.id;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Erreur liaison customer: %. Inscription continue.', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ÉTAPE 5: Créer le trigger principal
-- ============================================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ÉTAPE 6: Configurer les RLS policies pour user_profiles
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON user_profiles;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for service role" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for users own profile" ON user_profiles;

-- Créer des policies simples et efficaces
CREATE POLICY "Users can read own profile" 
  ON user_profiles FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON user_profiles FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON user_profiles FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy spéciale pour le trigger (via service role)
CREATE POLICY "Service role has full access" 
  ON user_profiles FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ÉTAPE 7: Réparer les données existantes
-- ============================================================
-- Créer les profils manquants
INSERT INTO user_profiles (id, email, created_at, updated_at)
SELECT 
  u.id, 
  u.email,
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Lier les customers existants aux users (si applicable)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    UPDATE customers c
    SET 
      user_id = u.id,
      is_guest = false
    FROM auth.users u
    WHERE c.email = u.email
    AND c.user_id IS NULL;
    
    RAISE NOTICE '✅ Customers existants liés aux users correspondants';
  END IF;
END $$;

-- ÉTAPE 8: Vérification finale
-- ============================================================
DO $$
DECLARE
  users_count INTEGER;
  profiles_count INTEGER;
  customers_count INTEGER;
  linked_customers INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_count FROM auth.users;
  SELECT COUNT(*) INTO profiles_count FROM user_profiles;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CONFIGURATION TERMINÉE AVEC SUCCÈS !';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Utilisateurs: %', users_count;
  RAISE NOTICE 'Profils: %', profiles_count;
  
  IF users_count = profiles_count THEN
    RAISE NOTICE '✅ Tous les utilisateurs ont un profil';
  ELSE
    RAISE WARNING '⚠️ % utilisateurs sans profil', users_count - profiles_count;
  END IF;
  
  -- Vérifier customers si la table existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    SELECT COUNT(*) INTO customers_count FROM customers;
    SELECT COUNT(*) INTO linked_customers FROM customers WHERE user_id IS NOT NULL;
    RAISE NOTICE 'Customers total: %', customers_count;
    RAISE NOTICE 'Customers liés à un user: %', linked_customers;
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎯 PROCHAINE ÉTAPE:';
  RAISE NOTICE 'Testez une inscription sur /test-auth';
  RAISE NOTICE '========================================';
END $$;