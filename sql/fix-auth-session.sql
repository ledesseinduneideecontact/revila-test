-- ============================================================
-- FIX: AUTH SESSION MISSING
-- Résout les problèmes de session après vérification email
-- ============================================================

-- 1. Vérifier les paramètres d'authentification
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNOSTIC AUTH SESSION';
  RAISE NOTICE '========================================';
END $$;

-- 2. Vérifier que les utilisateurs sont bien créés
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
  COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users
FROM auth.users;

-- 3. Désactiver temporairement la confirmation email si nécessaire
-- ATTENTION: Ne faire qu'en développement !
-- UPDATE auth.config SET value = 'false' WHERE key = 'mailer_autoconfirm';

-- 4. Fonction pour confirmer manuellement un email (DEV UNIQUEMENT)
CREATE OR REPLACE FUNCTION confirm_user_email(user_email TEXT)
RETURNS void AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Trouver l'utilisateur
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non trouvé: %', user_email;
  END IF;
  
  -- Confirmer l'email
  UPDATE auth.users 
  SET 
    email_confirmed_at = NOW(),
    confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = user_id;
  
  RAISE NOTICE '✅ Email confirmé pour: %', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Afficher les utilisateurs non confirmés
DO $$
DECLARE
  unconfirmed_count INTEGER;
  user_record RECORD;
BEGIN
  SELECT COUNT(*) INTO unconfirmed_count 
  FROM auth.users 
  WHERE email_confirmed_at IS NULL;
  
  IF unconfirmed_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ UTILISATEURS NON CONFIRMÉS: %', unconfirmed_count;
    RAISE NOTICE '========================================';
    
    FOR user_record IN 
      SELECT email, created_at 
      FROM auth.users 
      WHERE email_confirmed_at IS NULL
      LIMIT 10
    LOOP
      RAISE NOTICE 'Email: % | Créé: %', user_record.email, user_record.created_at;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Pour confirmer manuellement (DEV):';
    RAISE NOTICE 'SELECT confirm_user_email(''email@example.com'');';
  ELSE
    RAISE NOTICE '✅ Tous les utilisateurs sont confirmés';
  END IF;
END $$;

-- 6. Vérifier les policies RLS sur user_profiles
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'user_profiles';
  
  RAISE NOTICE '';
  RAISE NOTICE 'Policies sur user_profiles: %', policy_count;
  
  IF policy_count = 0 THEN
    RAISE WARNING '⚠️ Aucune policy RLS sur user_profiles !';
  END IF;
END $$;

-- 7. Créer une fonction de debug pour tester la connexion
CREATE OR REPLACE FUNCTION debug_user_session(user_email TEXT)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  email_confirmed BOOLEAN,
  has_profile BOOLEAN,
  profile_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email,
    u.created_at,
    (u.email_confirmed_at IS NOT NULL) as email_confirmed,
    (p.id IS NOT NULL) as has_profile,
    p.id as profile_id
  FROM auth.users u
  LEFT JOIN user_profiles p ON u.id = p.id
  WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Instructions finales
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 ACTIONS RECOMMANDÉES:';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '1. Dans Supabase Dashboard:';
  RAISE NOTICE '   - Authentication > Settings';
  RAISE NOTICE '   - Désactiver "Enable email confirmations" pour DEV';
  RAISE NOTICE '';
  RAISE NOTICE '2. URLs à vérifier:';
  RAISE NOTICE '   - Authentication > URL Configuration';
  RAISE NOTICE '   - Ajouter: http://localhost:3004/auth/callback-v2';
  RAISE NOTICE '';
  RAISE NOTICE '3. Pour debugger un utilisateur:';
  RAISE NOTICE '   SELECT * FROM debug_user_session(''email@example.com'');';
  RAISE NOTICE '';
  RAISE NOTICE '4. Pour confirmer manuellement (DEV):';
  RAISE NOTICE '   SELECT confirm_user_email(''email@example.com'');';
  RAISE NOTICE '========================================';
END $$;