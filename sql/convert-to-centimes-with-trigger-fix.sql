-- =====================================================
-- Script de conversion des prix en CENTIMES
-- Version avec gestion du trigger problématique
-- =====================================================

-- IMPORTANT: Exécuter ce script dans Supabase SQL Editor

BEGIN;

-- ================== ÉTAPE 1: DÉSACTIVER LE TRIGGER ==================

-- Désactiver temporairement le trigger qui cause l'erreur
ALTER TABLE order_items DISABLE TRIGGER ALL;
ALTER TABLE orders DISABLE TRIGGER ALL;

-- ================== ÉTAPE 2: ANALYSE AVANT CONVERSION ==================

SELECT 
    'AVANT conversion - orders' as status,
    COUNT(*) as nb_orders,
    MIN(total_amount) as min_total,
    MAX(total_amount) as max_total,
    AVG(total_amount)::numeric(10,2) as avg_total
FROM orders
WHERE total_amount IS NOT NULL;

SELECT 
    'AVANT conversion - order_items' as status,
    COUNT(*) as nb_items,
    MIN(unit_price) as min_price,
    MAX(unit_price) as max_price,
    AVG(unit_price)::numeric(10,2) as avg_price
FROM order_items
WHERE unit_price IS NOT NULL;

-- ================== ÉTAPE 3: CONVERSION EN CENTIMES ==================

-- Convertir les montants dans la table orders
UPDATE orders 
SET 
    subtotal_amount = subtotal_amount * 100,
    total_amount = total_amount * 100,
    shipping_cost = shipping_cost * 100,
    discount_amount = discount_amount * 100
WHERE total_amount < 500;  -- Protection contre double conversion

-- Convertir les prix dans order_items
UPDATE order_items 
SET unit_price = unit_price * 100
WHERE unit_price IS NOT NULL 
  AND unit_price < 100;  -- Protection contre double conversion

-- ================== ÉTAPE 4: VÉRIFICATION APRÈS CONVERSION ==================

SELECT 
    'APRÈS conversion - orders' as status,
    COUNT(*) as nb_orders,
    MIN(total_amount) as min_total_centimes,
    MAX(total_amount) as max_total_centimes,
    (MIN(total_amount) / 100.0)::numeric(10,2) as min_total_euros,
    (MAX(total_amount) / 100.0)::numeric(10,2) as max_total_euros
FROM orders
WHERE total_amount IS NOT NULL;

SELECT 
    'APRÈS conversion - order_items' as status,
    COUNT(*) as nb_items,
    MIN(unit_price) as min_price_centimes,
    MAX(unit_price) as max_price_centimes,
    (MIN(unit_price) / 100.0)::numeric(10,2) as min_price_euros,
    (MAX(unit_price) / 100.0)::numeric(10,2) as max_price_euros
FROM order_items
WHERE unit_price IS NOT NULL;

-- Afficher quelques exemples
SELECT 
    o.order_number,
    o.total_amount as total_centimes,
    (o.total_amount / 100.0)::numeric(10,2) as total_euros,
    o.shipping_cost as shipping_centimes,
    (o.shipping_cost / 100.0)::numeric(10,2) as shipping_euros,
    o.created_at
FROM orders o
ORDER BY o.created_at DESC
LIMIT 5;

-- ================== ÉTAPE 5: RÉACTIVER LES TRIGGERS ==================

-- Réactiver les triggers
ALTER TABLE order_items ENABLE TRIGGER ALL;
ALTER TABLE orders ENABLE TRIGGER ALL;

-- ================== DÉCISION FINALE ==================
-- Si tout est OK, décommenter et exécuter:
-- COMMIT;

-- Si problème, décommenter et exécuter:
-- ROLLBACK;