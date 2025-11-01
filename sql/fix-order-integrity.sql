-- Script de correction pour l'intégrité des commandes
-- Exécuter ce script dans Supabase SQL Editor

-- 1. Ajouter les colonnes manquantes dans orders si elles n'existent pas
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS items_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Créer une table pour les alertes système
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'critical', 'warning', 'info'
  message TEXT NOT NULL,
  order_id UUID REFERENCES orders(id),
  payment_intent_id VARCHAR(255),
  amount_cents INTEGER,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Créer un index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_system_alerts_order_id ON system_alerts(order_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON system_alerts(resolved);

-- 4. Ajouter un nouveau statut de paiement pour les cas problématiques
ALTER TABLE orders 
ADD CONSTRAINT check_payment_status 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'paid_but_incomplete'))
ON CONFLICT ON CONSTRAINT check_payment_status DO NOTHING;

-- 5. Mettre à jour le items_count pour les commandes existantes
UPDATE orders o
SET items_count = (
  SELECT COUNT(*) 
  FROM order_items oi 
  WHERE oi.order_id = o.id
)
WHERE items_count IS NULL OR items_count = 0;

-- 6. Identifier les commandes problématiques (payées mais sans items)
INSERT INTO system_alerts (type, message, order_id, payment_intent_id, amount_cents)
SELECT 
  'critical' as type,
  'Commande payée mais sans articles' as message,
  o.id as order_id,
  o.stripe_payment_intent_id as payment_intent_id,
  o.total_cents as amount_cents
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.payment_status = 'paid'
  AND oi.id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM system_alerts sa 
    WHERE sa.order_id = o.id 
    AND sa.type = 'critical'
    AND sa.message = 'Commande payée mais sans articles'
  );

-- 7. Créer une vue pour faciliter le monitoring
CREATE OR REPLACE VIEW v_orders_integrity AS
SELECT 
  o.id,
  o.order_number,
  o.created_at,
  o.payment_status,
  o.order_status,
  o.total_cents,
  o.customer_id,
  c.email as customer_email,
  c.first_name || ' ' || c.last_name as customer_name,
  COUNT(oi.id) as actual_items_count,
  o.items_count as stored_items_count,
  CASE 
    WHEN o.payment_status = 'paid' AND COUNT(oi.id) = 0 THEN 'CRITIQUE: Payé sans articles'
    WHEN o.payment_status = 'paid' AND COUNT(oi.id) != o.items_count THEN 'AVERTISSEMENT: Compteur items incorrect'
    WHEN o.payment_status = 'pending' AND COUNT(oi.id) = 0 THEN 'INFO: En attente sans articles'
    ELSE 'OK'
  END as integrity_status,
  STRING_AGG(DISTINCT oi.categorie, ', ') as categories,
  SUM(oi.quantity) as total_quantity
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN customers c ON o.customer_id = c.id
GROUP BY o.id, o.order_number, o.created_at, o.payment_status, 
         o.order_status, o.total_cents, o.customer_id, 
         c.email, c.first_name, c.last_name, o.items_count;

-- 8. Créer une fonction pour vérifier l'intégrité d'une commande
CREATE OR REPLACE FUNCTION check_order_integrity(p_order_id UUID)
RETURNS TABLE (
  is_valid BOOLEAN,
  order_id UUID,
  order_number VARCHAR,
  payment_status VARCHAR,
  items_count INTEGER,
  total_cents INTEGER,
  problems TEXT[]
) AS $$
DECLARE
  v_order RECORD;
  v_items_count INTEGER;
  v_problems TEXT[] := ARRAY[]::TEXT[];
  v_calculated_total INTEGER;
BEGIN
  -- Récupérer la commande
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false, 
      p_order_id, 
      NULL::VARCHAR, 
      NULL::VARCHAR, 
      0, 
      0, 
      ARRAY['Commande non trouvée']::TEXT[];
    RETURN;
  END IF;
  
  -- Compter les items
  SELECT COUNT(*) INTO v_items_count FROM order_items WHERE order_id = p_order_id;
  
  -- Vérifier les problèmes
  IF v_items_count = 0 THEN
    v_problems := array_append(v_problems, 'Aucun order_item trouvé');
  END IF;
  
  IF v_order.payment_status = 'paid' AND v_items_count = 0 THEN
    v_problems := array_append(v_problems, 'CRITIQUE: Commande payée mais sans articles');
  END IF;
  
  -- Calculer le total théorique
  SELECT 
    SUM(line_total_cents) + COALESCE(v_order.shipping_cents, 299) - COALESCE(v_order.discount_cents, 0)
  INTO v_calculated_total
  FROM order_items 
  WHERE order_id = p_order_id;
  
  IF v_calculated_total IS NOT NULL AND ABS(v_calculated_total - v_order.total_cents) > 10 THEN
    v_problems := array_append(v_problems, 
      format('Total calculé (%s) != total commande (%s)', v_calculated_total, v_order.total_cents));
  END IF;
  
  RETURN QUERY SELECT 
    (array_length(v_problems, 1) IS NULL OR array_length(v_problems, 1) = 0),
    v_order.id,
    v_order.order_number,
    v_order.payment_status,
    v_items_count,
    v_order.total_cents,
    v_problems;
END;
$$ LANGUAGE plpgsql;

-- 9. Rapport des commandes problématiques des dernières 48h
SELECT 
  order_number,
  customer_email,
  created_at,
  payment_status,
  integrity_status,
  total_cents / 100.0 as total_euros,
  actual_items_count,
  categories
FROM v_orders_integrity
WHERE created_at >= NOW() - INTERVAL '48 hours'
  AND integrity_status != 'OK'
ORDER BY created_at DESC;

-- 10. Statistiques globales
SELECT 
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE integrity_status = 'OK') as valid_orders,
  COUNT(*) FILTER (WHERE integrity_status LIKE 'CRITIQUE%') as critical_issues,
  COUNT(*) FILTER (WHERE integrity_status LIKE 'AVERTISSEMENT%') as warnings,
  SUM(total_cents) FILTER (WHERE integrity_status LIKE 'CRITIQUE%') / 100.0 as critical_amount_euros
FROM v_orders_integrity
WHERE created_at >= NOW() - INTERVAL '7 days';