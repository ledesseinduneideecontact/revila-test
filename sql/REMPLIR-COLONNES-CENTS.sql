-- =====================================================
-- SCRIPT POUR REMPLIR LES COLONNES _CENTS
-- À exécuter APRÈS avoir créé les colonnes manuellement
-- =====================================================

-- Remplir les colonnes dans orders
UPDATE orders 
SET 
    subtotal_cents = ROUND(subtotal_amount * 100)::INTEGER,
    total_cents = ROUND(total_amount * 100)::INTEGER,
    shipping_cents = ROUND(shipping_cost * 100)::INTEGER,
    discount_cents = ROUND(discount_amount * 100)::INTEGER
WHERE total_cents IS NULL OR total_cents = 0;

-- Remplir les colonnes dans order_items
UPDATE order_items 
SET unit_price_cents = ROUND(unit_price * 100)::INTEGER
WHERE unit_price_cents IS NULL OR unit_price_cents = 0;

-- Vérifier le résultat
SELECT 
    order_number,
    total_amount as euros,
    total_cents as centimes,
    shipping_cost as shipping_euros,
    shipping_cents
FROM orders
ORDER BY created_at DESC
LIMIT 10;