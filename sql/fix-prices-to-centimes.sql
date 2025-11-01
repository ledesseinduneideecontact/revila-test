-- =====================================================
-- Script de conversion des prix en CENTIMES
-- Pour cohérence avec Stripe qui utilise les centimes
-- =====================================================

-- IMPORTANT: Faire une sauvegarde avant d'exécuter ce script !
-- Exécuter dans Supabase SQL Editor

BEGIN;

-- 1. Afficher l'état actuel des prix (pour vérification)
SELECT 
    'AVANT conversion' as status,
    COUNT(*) as nb_items,
    MIN(unit_price) as min_price,
    MAX(unit_price) as max_price,
    AVG(unit_price)::numeric(10,2) as avg_price
FROM order_items
WHERE unit_price IS NOT NULL;

-- 2. Convertir les prix dans order_items (multiplier par 100)
-- Protection: ne convertir que si les prix semblent être en euros (< 100)
UPDATE order_items 
SET unit_price = unit_price * 100
WHERE unit_price IS NOT NULL 
  AND unit_price < 100;  -- Protection contre double conversion

-- 3. Convertir le total_amount dans orders si cette colonne existe
UPDATE orders 
SET total_amount = total_amount * 100
WHERE total_amount IS NOT NULL 
  AND total_amount < 1000;  -- Protection contre double conversion

-- 4. Convertir shipping_cost dans orders si cette colonne existe
UPDATE orders 
SET shipping_cost = shipping_cost * 100
WHERE shipping_cost IS NOT NULL 
  AND shipping_cost < 100;

-- 5. Convertir discount_amount dans orders si cette colonne existe
UPDATE orders 
SET discount_amount = discount_amount * 100
WHERE discount_amount IS NOT NULL 
  AND discount_amount < 100;

-- 6. Vérifier les résultats après conversion
SELECT 
    'APRÈS conversion' as status,
    COUNT(*) as nb_items,
    MIN(unit_price) as min_price,
    MAX(unit_price) as max_price,
    AVG(unit_price)::numeric(10,2) as avg_price
FROM order_items
WHERE unit_price IS NOT NULL;

-- 7. Afficher quelques exemples pour vérification
SELECT 
    oi.id,
    oi.order_id,
    oi.format,
    oi.with_frame,
    oi.unit_price as prix_centimes,
    oi.unit_price / 100.0 as prix_euros,
    o.order_number
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
ORDER BY oi.created_at DESC
LIMIT 10;

-- 8. Résumé par format pour vérifier la cohérence
SELECT 
    format,
    with_frame,
    COUNT(*) as nb_items,
    MIN(unit_price) as min_centimes,
    MAX(unit_price) as max_centimes,
    AVG(unit_price)::numeric(10,2) as avg_centimes,
    (AVG(unit_price) / 100.0)::numeric(10,2) as avg_euros
FROM order_items
WHERE unit_price IS NOT NULL
GROUP BY format, with_frame
ORDER BY format, with_frame;

-- SI TOUT EST OK, VALIDER LA TRANSACTION
-- COMMIT;

-- SI PROBLÈME, ANNULER LA TRANSACTION
-- ROLLBACK;