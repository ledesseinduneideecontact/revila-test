-- ========================================
-- TABLE PROMO_CODES - Gestion dynamique des codes promo
-- ========================================

-- Créer la table promo_codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  code character varying(50) NOT NULL UNIQUE,
  discount_percentage integer NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone,
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  max_usage integer, -- NULL = illimité
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT promo_codes_pkey PRIMARY KEY (id),
  CONSTRAINT promo_codes_code_key UNIQUE (code)
);

-- Index pour recherche rapide par code
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(UPPER(code));

-- Index pour les codes actifs
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON public.promo_codes(is_active, start_date, end_date);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insérer les codes promo existants
INSERT INTO public.promo_codes (code, discount_percentage, start_date, end_date, is_active) VALUES
  ('PETITEFLEUR', 10, '2024-01-01'::timestamp, NULL, true),
  ('REVIVE10', 10, '2024-01-01'::timestamp, NULL, true),
  ('PARRAIN20', 20, '2024-01-01'::timestamp, NULL, true),
  ('NOEL', 15, '2024-12-01'::timestamp, '2025-01-15'::timestamp, true),
  ('NOEL2025', 15, '2024-12-01'::timestamp, '2025-01-15'::timestamp, true),
  ('BWVIDEO', 5, '2024-01-01'::timestamp, NULL, true),
  ('STUDIO69', 5, '2024-01-01'::timestamp, NULL, true),
  ('SERGUEY', 5, '2024-01-01'::timestamp, NULL, true)
ON CONFLICT (code) DO NOTHING;

-- Fonction pour valider un code promo
CREATE OR REPLACE FUNCTION validate_promo_code(p_code text)
RETURNS TABLE(
  is_valid boolean,
  discount_percentage integer,
  message text
) AS $$
DECLARE
  v_promo record;
BEGIN
  -- Rechercher le code promo (insensible à la casse)
  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE UPPER(code) = UPPER(TRIM(p_code))
    AND is_active = true
  LIMIT 1;

  -- Si le code n'existe pas
  IF NOT FOUND THEN
    RETURN QUERY SELECT false::boolean, 0::integer, 'Code promo invalide'::text;
    RETURN;
  END IF;

  -- Vérifier la date de début
  IF v_promo.start_date > NOW() THEN
    RETURN QUERY SELECT false::boolean, 0::integer, 'Ce code promo n''est pas encore actif'::text;
    RETURN;
  END IF;

  -- Vérifier la date de fin
  IF v_promo.end_date IS NOT NULL AND v_promo.end_date < NOW() THEN
    RETURN QUERY SELECT false::boolean, 0::integer, 'Ce code promo a expiré'::text;
    RETURN;
  END IF;

  -- Vérifier le nombre d'utilisations
  IF v_promo.max_usage IS NOT NULL AND v_promo.usage_count >= v_promo.max_usage THEN
    RETURN QUERY SELECT false::boolean, 0::integer, 'Ce code promo a atteint sa limite d''utilisation'::text;
    RETURN;
  END IF;

  -- Code valide
  RETURN QUERY SELECT 
    true::boolean, 
    v_promo.discount_percentage::integer,
    CONCAT('Code promo ', v_promo.code, ' valide - ', v_promo.discount_percentage::text, '% de réduction')::text;
END;
$$ LANGUAGE plpgsql;

-- Permissions pour l'utilisateur anon
GRANT SELECT ON public.promo_codes TO anon;
GRANT EXECUTE ON FUNCTION validate_promo_code TO anon;

-- Permissions pour l'utilisateur authenticated
GRANT SELECT ON public.promo_codes TO authenticated;
GRANT EXECUTE ON FUNCTION validate_promo_code TO authenticated;

-- Commentaires
COMMENT ON TABLE public.promo_codes IS 'Table des codes promotionnels avec gestion des dates de validité';
COMMENT ON COLUMN public.promo_codes.code IS 'Code promo unique (insensible à la casse)';
COMMENT ON COLUMN public.promo_codes.discount_percentage IS 'Pourcentage de réduction (5 = 5%)';
COMMENT ON COLUMN public.promo_codes.start_date IS 'Date de début de validité';
COMMENT ON COLUMN public.promo_codes.end_date IS 'Date de fin de validité (NULL = pas de fin)';
COMMENT ON COLUMN public.promo_codes.is_active IS 'Code actif ou désactivé';
COMMENT ON COLUMN public.promo_codes.usage_count IS 'Nombre de fois utilisé';
COMMENT ON COLUMN public.promo_codes.max_usage IS 'Nombre maximum d''utilisations (NULL = illimité)';