-- =====================================================
-- Script MINIMAL de conversion des prix en CENTIMES
-- Version la plus simple sans triggers
-- =====================================================

-- Exécuter dans Supabase SQL Editor

-- ÉTAPE 1: Voir l'état actuel
SELECT 
    'AVANT' as moment,
    MIN(total_amount) as min_total,
    MAX(total_amount) as max_total,
    COUNT(*) as nb_orders
FROM orders;

-- ÉTAPE 2: Faire la conversion (multiplier par 100)
BEGIN;

-- Convertir orders
UPDATE orders 
SET 
    subtotal_amount = subtotal_amount * 100,
    total_amount = total_amount * 100,
    shipping_cost = shipping_cost * 100,
    discount_amount = discount_amount * 100
WHERE total_amount < 500;

-- Convertir order_items  
UPDATE order_items 
SET unit_price = unit_price * 100
WHERE unit_price < 100;

-- ÉTAPE 3: Vérifier le résultat
SELECT 
    'APRÈS' as moment,
    MIN(total_amount) as min_total_centimes,
    MAX(total_amount) as max_total_centimes,
    ROUND(MIN(total_amount)/100.0, 2) as min_euros,
    ROUND(MAX(total_amount)/100.0, 2) as max_euros,
    COUNT(*) as nb_orders
FROM orders;

-- Voir quelques exemples
SELECT 
    order_number,
    total_amount as centimes,
    ROUND(total_amount/100.0, 2) as euros
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- SI OK: COMMIT;
-- SI PROBLÈME: ROLLBACK;