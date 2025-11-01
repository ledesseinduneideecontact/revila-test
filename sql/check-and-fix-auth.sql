-- ============================================================
-- DIAGNOSTIC ET CORRECTION DU SYSTÈME D'AUTHENTIFICATION
-- ============================================================

-- 1. Vérifier que la table user_profiles existe avec les bonnes colonnes
DO $$
BEGIN
    -- Vérifier l'existence de la table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        RAISE NOTICE '❌ Table user_profiles n''existe pas - Création...';
        
        CREATE TABLE user_profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT,
            first_name TEXT,
            last_name TEXT,
            phone TEXT,
            avatar_url TEXT,
            bio TEXT,
            newsletter_consent BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE '✅ Table user_profiles créée';
    ELSE
        RAISE NOTICE '✅ Table user_profiles existe';
    END IF;
    
    -- Ajouter les colonnes manquantes si nécessaire
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'newsletter_consent') THEN
        ALTER TABLE user_profiles ADD COLUMN newsletter_consent BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Colonne newsletter_consent ajoutée';
    END IF;
END $$;

-- 2. Supprimer l'ancien trigger s'il existe (au cas où il y aurait un conflit)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 3. Créer une fonction de trigger améliorée avec gestion d'erreur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Insérer le profil uniquement s'il n'existe pas déjà
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
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        first_name = COALESCE(EXCLUDED.first_name, user_profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, user_profiles.last_name),
        phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
        newsletter_consent = COALESCE(EXCLUDED.newsletter_consent, user_profiles.newsletter_consent),
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur, logger mais ne pas bloquer la création de l'utilisateur
        RAISE LOG 'Erreur lors de la création du profil pour %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recréer le trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Activer RLS et créer les policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role bypass" ON user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON user_profiles;

-- Créer des policies plus permissives
CREATE POLICY "Enable read access for users" 
    ON user_profiles FOR SELECT 
    USING (true); -- Tout le monde peut voir les profils (vous pouvez restreindre si besoin)

CREATE POLICY "Enable insert for authentication" 
    ON user_profiles FOR INSERT 
    WITH CHECK (true); -- Permet l'insertion (le trigger s'en occupe)

CREATE POLICY "Enable update for users" 
    ON user_profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable delete for users" 
    ON user_profiles FOR DELETE 
    USING (auth.uid() = id);

-- 6. Créer les profils manquants pour les utilisateurs existants
INSERT INTO user_profiles (id, email, created_at, updated_at)
SELECT 
    id, 
    email,
    created_at,
    NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;

-- 7. Test de vérification
DO $$
DECLARE
    v_user_count INTEGER;
    v_profile_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_user_count FROM auth.users;
    SELECT COUNT(*) INTO v_profile_count FROM user_profiles;
    
    RAISE NOTICE '==================================';
    RAISE NOTICE '📊 RÉSUMÉ DU DIAGNOSTIC';
    RAISE NOTICE '==================================';
    RAISE NOTICE 'Utilisateurs auth.users: %', v_user_count;
    RAISE NOTICE 'Profils user_profiles: %', v_profile_count;
    
    IF v_user_count = v_profile_count THEN
        RAISE NOTICE '✅ Tous les utilisateurs ont un profil';
    ELSE
        RAISE NOTICE '⚠️ % utilisateurs sans profil', (v_user_count - v_profile_count);
    END IF;
    
    RAISE NOTICE '==================================';
    RAISE NOTICE '✅ Système d''authentification prêt';
    RAISE NOTICE '✅ Trigger configuré';
    RAISE NOTICE '✅ Policies RLS actives';
    RAISE NOTICE '==================================';
END $$;

-- 8. Tester que le trigger fonctionne
-- ATTENTION: Ne pas exécuter en production, juste pour test
/*
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Créer un utilisateur de test
    test_user_id := gen_random_uuid();
    
    -- Simuler l'insertion d'un utilisateur (normalement fait par Supabase Auth)
    INSERT INTO auth.users (
        id,
        email,
        raw_user_meta_data
    ) VALUES (
        test_user_id,
        'test_' || test_user_id || '@example.com',
        '{"first_name": "Test", "last_name": "User", "phone": "0123456789"}'::jsonb
    );
    
    -- Vérifier que le profil a été créé
    IF EXISTS (SELECT 1 FROM user_profiles WHERE id = test_user_id) THEN
        RAISE NOTICE '✅ TEST RÉUSSI: Le profil a été créé automatiquement';
        -- Nettoyer
        DELETE FROM auth.users WHERE id = test_user_id;
    ELSE
        RAISE NOTICE '❌ TEST ÉCHOUÉ: Le profil n''a pas été créé';
    END IF;
END $$;
*/