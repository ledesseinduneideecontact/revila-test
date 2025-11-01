-- ============================================================
-- AJOUTER LES COLONNES MANQUANTES POUR COMPLÉTER LES LIAISONS
-- ============================================================

-- 1. Vérifier et ajouter user_id à la table orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE orders 
    ADD COLUMN user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
    
    -- Créer un index pour améliorer les performances
    CREATE INDEX idx_orders_user_id ON orders(user_id);
    
    RAISE NOTICE 'Colonne user_id ajoutée à la table orders';
  ELSE
    RAISE NOTICE 'Colonne user_id existe déjà dans orders';
  END IF;
END $$;

-- 2. Vérifier et ajouter saved_cart_id à la table orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'saved_cart_id'
  ) THEN
    ALTER TABLE orders 
    ADD COLUMN saved_cart_id UUID REFERENCES saved_carts(id) ON DELETE SET NULL;
    
    -- Créer un index
    CREATE INDEX idx_orders_saved_cart_id ON orders(saved_cart_id);
    
    RAISE NOTICE 'Colonne saved_cart_id ajoutée à la table orders';
  ELSE
    RAISE NOTICE 'Colonne saved_cart_id existe déjà dans orders';
  END IF;
END $$;

-- 3. Lier automatiquement les commandes existantes aux utilisateurs via l'email
UPDATE orders o
SET user_id = up.id
FROM customers c
JOIN user_profiles up ON c.email = up.email
WHERE o.customer_id = c.id
AND o.user_id IS NULL;

-- 4. Vérifier le résultat
SELECT 
    'Commandes liées aux utilisateurs:' as info,
    COUNT(*) FILTER (WHERE user_id IS NOT NULL) as with_user,
    COUNT(*) FILTER (WHERE user_id IS NULL) as without_user,
    COUNT(*) as total
FROM orders;

-- 5. Créer une fonction pour lier automatiquement les futures commandes
CREATE OR REPLACE FUNCTION auto_link_order_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Si user_id n'est pas défini, essayer de le trouver via l'email du customer
  IF NEW.user_id IS NULL THEN
    SELECT up.id INTO NEW.user_id
    FROM customers c
    JOIN user_profiles up ON c.email = up.email
    WHERE c.id = NEW.customer_id
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Créer le trigger si il n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'auto_link_order_to_user_trigger'
  ) THEN
    CREATE TRIGGER auto_link_order_to_user_trigger
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION auto_link_order_to_user();
    
    RAISE NOTICE 'Trigger auto_link_order_to_user_trigger créé';
  ELSE
    RAISE NOTICE 'Trigger auto_link_order_to_user_trigger existe déjà';
  END IF;
END $$;

-- 7. Vérifier la structure finale
SELECT 
    'Structure finale de orders:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'orders'
AND column_name IN ('id', 'customer_id', 'user_id', 'saved_cart_id', 'status', 'total_amount')
ORDER BY 
    CASE column_name
        WHEN 'id' THEN 1
        WHEN 'customer_id' THEN 2
        WHEN 'user_id' THEN 3
        WHEN 'saved_cart_id' THEN 4
        WHEN 'status' THEN 5
        WHEN 'total_amount' THEN 6
    END;