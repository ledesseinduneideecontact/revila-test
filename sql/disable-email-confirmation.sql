-- ============================================================
-- DÉSACTIVER LA CONFIRMATION EMAIL (DÉVELOPPEMENT UNIQUEMENT)
-- ============================================================
-- ⚠️ NE PAS UTILISER EN PRODUCTION

-- Cette requête permet de se connecter immédiatement après inscription
-- sans avoir besoin de confirmer l'email

-- Option 1 : Confirmer automatiquement tous les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS trigger AS $$
BEGIN
  -- Confirmer automatiquement l'email (confirmed_at est généré automatiquement)
  UPDATE auth.users 
  SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS auto_confirm_email_trigger ON auth.users;

-- Créer le trigger
CREATE TRIGGER auto_confirm_email_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.auto_confirm_email();

-- Confirmer tous les utilisateurs existants non confirmés
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Vérification
DO $$
DECLARE
  v_unconfirmed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_unconfirmed_count 
  FROM auth.users 
  WHERE email_confirmed_at IS NULL;
  
  RAISE NOTICE '================================';
  RAISE NOTICE '✅ Auto-confirmation activée';
  RAISE NOTICE 'Utilisateurs non confirmés: %', v_unconfirmed_count;
  RAISE NOTICE '================================';
  RAISE NOTICE '⚠️  ATTENTION: Mode développement';
  RAISE NOTICE '⚠️  Ne pas utiliser en production';
  RAISE NOTICE '================================';
END $$;