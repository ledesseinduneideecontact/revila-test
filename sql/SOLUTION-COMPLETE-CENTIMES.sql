-- =====================================================
-- SOLUTION COMPLÈTE : SUPPRIMER TRIGGER + CRÉER COLONNES
-- À EXÉCUTER DANS SUPABASE SQL EDITOR
-- =====================================================

-- ÉTAPE 1: D'ABORD SUPPRIMER LE TRIGGER PROBLÉMATIQUE
DROP TRIGGER IF EXISTS recalculate_order_totals_trigger ON order_items;
DROP FUNCTION IF EXISTS recalculate_order_totals() CASCADE;

-- ÉTAPE 2: Ajouter les nouvelles colonnes dans orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS subtotal_cents INTEGER,
ADD COLUMN IF NOT EXISTS total_cents INTEGER,
ADD COLUMN IF NOT EXISTS shipping_cents INTEGER,
ADD COLUMN IF NOT EXISTS discount_cents INTEGER;

-- ÉTAPE 3: Ajouter les colonnes dans order_items
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS unit_price_cents INTEGER,
ADD COLUMN IF NOT EXISTS line_total_cents INTEGER;

-- ÉTAPE 4: Remplir les nouvelles colonnes avec les valeurs en centimes
UPDATE orders 
SET 
    subtotal_cents = ROUND(subtotal_amount * 100)::INTEGER,
    total_cents = ROUND(total_amount * 100)::INTEGER,
    shipping_cents = ROUND(shipping_cost * 100)::INTEGER,
    discount_cents = ROUND(discount_amount * 100)::INTEGER
WHERE total_cents IS NULL OR total_cents = 0;

UPDATE order_items 
SET 
    unit_price_cents = ROUND(unit_price * 100)::INTEGER,
    line_total_cents = ROUND(unit_price * 100)::INTEGER  -- Pour l'instant même valeur que unit_price_cents
WHERE unit_price_cents IS NULL OR unit_price_cents = 0;

-- ÉTAPE 5: Vérifier les résultats dans orders
SELECT 
    'ORDERS - Vérification' as table_info,
    order_number,
    total_amount as total_euros,
    total_cents,
    total_cents / 100.0 as total_reconverti,
    shipping_cost as shipping_euros,
    shipping_cents,
    payment_status
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- ÉTAPE 6: Vérifier les résultats dans order_items
SELECT 
    'ORDER_ITEMS - Vérification' as table_info,
    oi.id,
    oi.unit_price as price_euros,
    oi.unit_price_cents as price_cents,
    oi.unit_price_cents / 100.0 as price_reconverti,
    o.order_number
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE oi.unit_price_cents IS NOT NULL
ORDER BY oi.created_at DESC
LIMIT 5;

-- ÉTAPE 7: Statistiques finales
SELECT 
    'STATISTIQUES' as info,
    COUNT(*) as nb_commandes,
    COUNT(total_cents) as nb_avec_cents,
    MIN(total_cents) as min_cents,
    MAX(total_cents) as max_cents,
    ROUND(AVG(total_cents)/100.0, 2) as moyenne_euros
FROM orders;

-- =====================================================
-- SUCCÈS ! Les colonnes _cents sont créées et remplies
-- =====================================================
-- 
-- Dans votre code TypeScript, utilisez maintenant :
-- - order.total_cents (au lieu de order.total_amount * 100)
-- - order.shipping_cents (au lieu de order.shipping_cost * 100)
-- - item.unit_price_cents (au lieu de item.unit_price * 100)
-- 
-- Pour Stripe :
-- amount: order.total_cents  // Directement en centimes !
-- =====================================================