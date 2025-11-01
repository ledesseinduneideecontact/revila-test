-- ============================================================
-- REVIVE - Liaison des tables existantes avec le système Auth
-- ============================================================
-- Ce script lie les tables existantes (orders, order_items, customers, webhook_events)
-- avec le nouveau système d'authentification
-- ============================================================

-- 1. MISE À JOUR DE LA TABLE CUSTOMERS
-- Ajouter le lien avec les comptes utilisateurs
DO $$
BEGIN
  -- Ajouter user_id si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'customers' AND column_name = 'user_id') THEN
    ALTER TABLE customers ADD COLUMN user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
  END IF;
  
  -- Ajouter is_guest si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'customers' AND column_name = 'is_guest') THEN
    ALTER TABLE customers ADD COLUMN is_guest BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- 2. MISE À JOUR DE LA TABLE ORDERS
-- Ajouter un lien avec user_profiles pour tracer les commandes des utilisateurs connectés
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' AND column_name = 'user_id') THEN
    ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
  END IF;
  
  -- Ajouter un champ pour lier avec saved_cart si la commande provient d'un panier sauvegardé
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' AND column_name = 'saved_cart_id') THEN
    ALTER TABLE orders ADD COLUMN saved_cart_id UUID REFERENCES saved_carts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_saved_cart_id ON orders(saved_cart_id);

-- 3. FONCTION POUR LIER AUTOMATIQUEMENT LES COMMANDES AUX UTILISATEURS
-- Cette fonction lie automatiquement une commande à un utilisateur basé sur l'email
CREATE OR REPLACE FUNCTION link_order_to_user()
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
  
  -- Mettre à jour le customer pour le lier à l'utilisateur aussi
  IF NEW.user_id IS NOT NULL THEN
    UPDATE customers 
    SET user_id = NEW.user_id, is_guest = false
    WHERE id = NEW.customer_id 
    AND user_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour lier automatiquement les commandes
DROP TRIGGER IF EXISTS link_order_to_user_trigger ON orders;
CREATE TRIGGER link_order_to_user_trigger
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION link_order_to_user();

-- 4. MIGRATION DES DONNÉES EXISTANTES
-- Lier les customers existants aux user_profiles basé sur l'email
UPDATE customers c
SET user_id = up.id,
    is_guest = false
FROM user_profiles up
WHERE c.email = up.email
AND c.user_id IS NULL;

-- Lier les orders existantes aux utilisateurs via les customers
UPDATE orders o
SET user_id = c.user_id
FROM customers c
WHERE o.customer_id = c.id
AND o.user_id IS NULL
AND c.user_id IS NOT NULL;

-- 5. FONCTION POUR CONVERTIR UN PANIER SAUVEGARDÉ EN COMMANDE
CREATE OR REPLACE FUNCTION convert_saved_cart_to_order(
  p_cart_id UUID,
  p_order_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Marquer le panier comme inactif
  UPDATE saved_carts 
  SET is_active = false,
      updated_at = NOW()
  WHERE id = p_cart_id;
  
  -- Lier la commande au panier sauvegardé
  UPDATE orders
  SET saved_cart_id = p_cart_id
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- 6. VUE POUR VOIR LES COMMANDES D'UN UTILISATEUR
CREATE OR REPLACE VIEW user_orders AS
SELECT 
  o.*,
  c.email as customer_email,
  c.first_name,
  c.last_name,
  up.id as user_profile_id
FROM orders o
JOIN customers c ON o.customer_id = c.id
LEFT JOIN user_profiles up ON o.user_id = up.id
WHERE o.user_id IS NOT NULL;

-- 7. VUE POUR LES STATISTIQUES UTILISATEUR
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  up.id as user_id,
  up.email,
  up.first_name,
  up.last_name,
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) as completed_orders,
  COUNT(DISTINCT sc.id) as saved_carts_count,
  COALESCE(SUM(o.total_amount), 0) as total_spent
FROM user_profiles up
LEFT JOIN orders o ON o.user_id = up.id
LEFT JOIN saved_carts sc ON sc.user_id = up.id
GROUP BY up.id, up.email, up.first_name, up.last_name;

-- 8. RLS POLICIES POUR LES VUES ET TABLES MISES À JOUR

-- Policies pour orders (permettre aux utilisateurs de voir leurs commandes)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id OR 
         EXISTS (
           SELECT 1 FROM customers c 
           WHERE c.id = orders.customer_id 
           AND c.user_id = auth.uid()
         ));

-- Policies pour order_items (voir les items de leurs commandes)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND (o.user_id = auth.uid() OR
           EXISTS (
             SELECT 1 FROM customers c 
             WHERE c.id = o.customer_id 
             AND c.user_id = auth.uid()
           ))
    )
  );

-- Policies pour customers (voir et modifier leurs propres infos)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own customer info" ON customers;
CREATE POLICY "Users can view own customer info"
  ON customers FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own customer info" ON customers;
CREATE POLICY "Users can update own customer info"
  ON customers FOR UPDATE
  USING (auth.uid() = user_id);

-- Note: webhook_events reste sans RLS car géré côté serveur uniquement

-- 9. FONCTION HELPER POUR RÉCUPÉRER L'HISTORIQUE D'UN UTILISATEUR
CREATE OR REPLACE FUNCTION get_user_order_history(p_user_id UUID)
RETURNS TABLE (
  order_id UUID,
  order_number TEXT,
  order_date TIMESTAMPTZ,
  status TEXT,
  total_amount DECIMAL,
  items_count BIGINT,
  from_saved_cart BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as order_id,
    o.order_number,
    o.created_at as order_date,
    o.status,
    o.total_amount,
    COUNT(oi.id) as items_count,
    (o.saved_cart_id IS NOT NULL) as from_saved_cart
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  WHERE o.user_id = p_user_id
  GROUP BY o.id, o.order_number, o.created_at, o.status, o.total_amount, o.saved_cart_id
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FIN DU SCRIPT DE LIAISON
-- ============================================================