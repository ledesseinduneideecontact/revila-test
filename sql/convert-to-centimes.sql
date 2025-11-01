-- Script de conversion des prix en centimes pour Stripe
-- IMPORTANT: Faire une sauvegarde avant d'exécuter ce script

-- 1. Convertir les prix dans order_items (multiplier par 100)
UPDATE order_items 
SET unit_price = unit_price * 100
WHERE unit_price < 1000; -- Protection pour éviter double conversion

-- 2. Convertir le total dans orders si cette colonne existe
UPDATE orders 
SET total_amount = total_amount * 100
WHERE total_amount IS NOT NULL AND total_amount < 1000;

-- 3. Vérifier les résultats
SELECT 'order_items' as table_name, 
       MIN(unit_price) as min_price, 
       MAX(unit_price) as max_price,
       AVG(unit_price) as avg_price
FROM order_items
UNION ALL
SELECT 'orders' as table_name,
       MIN(total_amount) as min_price,
       MAX(total_amount) as max_price,
       AVG(total_amount) as avg_price
FROM orders
WHERE total_amount IS NOT NULL;

-- 4. Si vous avez une table de produits avec des prix
-- UPDATE products 
-- SET price = price * 100
-- WHERE price < 1000;

-- Note: Les prix devraient maintenant être:
-- 10€ = 1000 centimes
-- 20€ = 2000 centimes
-- 30€ = 3000 centimes
-- etc.