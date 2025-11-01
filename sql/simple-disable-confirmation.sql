-- ============================================================
-- SOLUTION SIMPLE : DÉSACTIVER LA CONFIRMATION EMAIL
-- ============================================================

-- 1. D'abord, confirmer tous les utilisateurs existants
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 2. Vérifier le résultat
SELECT 
  COUNT(*) as total_users,
  COUNT(email_confirmed_at) as confirmed_users,
  COUNT(*) - COUNT(email_confirmed_at) as unconfirmed_users
FROM auth.users;

-- 3. Message
DO $$
BEGIN
  RAISE NOTICE '================================';
  RAISE NOTICE '✅ Tous les utilisateurs existants confirmés';
  RAISE NOTICE '================================';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Pour désactiver complètement';
  RAISE NOTICE '   la confirmation email:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Allez dans Supabase Dashboard';
  RAISE NOTICE '2. Authentication → Providers → Email';
  RAISE NOTICE '3. DÉCOCHEZ "Confirm email"';
  RAISE NOTICE '4. Sauvegardez';
  RAISE NOTICE '================================';
END $$;