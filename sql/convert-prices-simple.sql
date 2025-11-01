-- =====================================================
-- Script SIMPLE de conversion des prix en CENTIMES
-- Sans manipulation des triggers système
-- =====================================================

-- IMPORTANT: Exécuter ce script dans Supabase SQL Editor

BEGIN;

-- ================== ÉTAPE 1: VÉRIFIER L'ÉTAT ACTUEL ==================

-- Afficher l'état avant conversion
SELECT 
    'ÉTAT ACTUEL DES PRIX' as info,
    (SELECT COUNT(*) FROM orders WHERE total_amount < 100) as orders_en_euros,
    (SELECT COUNT(*) FROM order_items WHERE unit_price < 100) as items_en_euros,
    (SELECT MIN(total_amount) FROM orders) as min_total,
    (SELECT MAX(total_amount) FROM orders) as max_total;

-- ================== ÉTAPE 2: DÉSACTIVER LES TRIGGERS UTILISATEUR ==================

-- Lister les triggers utilisateur (non système) pour information
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgtype
FROM pg_trigger
WHERE tgrelid IN ('orders'::regclass, 'order_items'::regclass)
  AND NOT tgisinternal  -- Exclure les triggers système
  AND tgname NOT LIKE 'RI_ConstraintTrigger%';  -- Exclure les triggers de contraintes

-- Désactiver uniquement le trigger problématique s'il existe
DO $$
BEGIN
    -- Désactiver le trigger recalculate_order_totals s'il existe
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'recalculate_order_totals_trigger'
    ) THEN
        ALTER TABLE order_items DISABLE TRIGGER recalculate_order_totals_trigger;
    END IF;
END $$;

-- ================== ÉTAPE 3: CONVERSION DES PRIX ==================

-- IMPORTANT: Les UPDATE sont faits avec protection contre double conversion

-- 3.1 Convertir la table orders (multiplier par 100)
UPDATE orders 
SET 
    subtotal_amount = CASE 
        WHEN subtotal_amount < 100 THEN subtotal_amount * 100 
        ELSE subtotal_amount 
    END,
    total_amount = CASE 
        WHEN total_amount < 500 THEN total_amount * 100 
        ELSE total_amount 
    END,
    shipping_cost = CASE 
        WHEN shipping_cost < 50 THEN shipping_cost * 100 
        ELSE shipping_cost 
    END,
    discount_amount = CASE 
        WHEN discount_amount < 100 THEN discount_amount * 100 
        ELSE discount_amount 
    END
WHERE total_amount < 500;  -- Ne traiter que les commandes en euros

-- Afficher le nombre de lignes modifiées
GET DIAGNOSTICS;

-- 3.2 Convertir la table order_items (multiplier par 100)
UPDATE order_items 
SET unit_price = unit_price * 100
WHERE unit_price IS NOT NULL 
  AND unit_price < 100;  -- Ne convertir que les prix en euros

-- ================== ÉTAPE 4: VÉRIFICATION ==================

-- Vérifier les conversions
SELECT 
    'APRÈS CONVERSION - ORDERS' as table_name,
    COUNT(*) as total_lignes,
    MIN(total_amount) as min_total_centimes,
    MAX(total_amount) as max_total_centimes,
    ROUND(MIN(total_amount) / 100.0, 2) as min_total_euros,
    ROUND(MAX(total_amount) / 100.0, 2) as max_total_euros,
    ROUND(AVG(total_amount) / 100.0, 2) as avg_total_euros
FROM orders
WHERE total_amount IS NOT NULL;

SELECT 
    'APRÈS CONVERSION - ITEMS' as table_name,
    COUNT(*) as total_lignes,
    MIN(unit_price) as min_price_centimes,
    MAX(unit_price) as max_price_centimes,
    ROUND(MIN(unit_price) / 100.0, 2) as min_price_euros,
    ROUND(MAX(unit_price) / 100.0, 2) as max_price_euros,
    ROUND(AVG(unit_price) / 100.0, 2) as avg_price_euros
FROM order_items
WHERE unit_price IS NOT NULL;

-- Exemples de commandes converties
SELECT 
    order_number,
    total_amount as total_centimes,
    ROUND(total_amount / 100.0, 2) as total_euros,
    shipping_cost as shipping_centimes,
    ROUND(shipping_cost / 100.0, 2) as shipping_euros,
    subtotal_amount as subtotal_centimes,
    ROUND(subtotal_amount / 100.0, 2) as subtotal_euros,
    created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- ================== ÉTAPE 5: RÉACTIVER LES TRIGGERS ==================

-- Réactiver le trigger s'il avait été désactivé
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'recalculate_order_totals_trigger'
    ) THEN
        ALTER TABLE order_items ENABLE TRIGGER recalculate_order_totals_trigger;
    END IF;
END $$;

-- ================== VALIDATION ==================

-- Distribution des prix pour validation finale
SELECT 
    'DISTRIBUTION DES TOTAUX' as info,
    COUNT(CASE WHEN total_amount < 1000 THEN 1 END) as "moins_10_euros",
    COUNT(CASE WHEN total_amount >= 1000 AND total_amount < 5000 THEN 1 END) as "10_50_euros",
    COUNT(CASE WHEN total_amount >= 5000 AND total_amount < 10000 THEN 1 END) as "50_100_euros",
    COUNT(CASE WHEN total_amount >= 10000 THEN 1 END) as "plus_100_euros"
FROM orders;

-- ================== IMPORTANT ==================
-- 
-- VÉRIFIEZ LES RÉSULTATS CI-DESSUS
-- 
-- Si tout est correct (prix en centimes):
--   Exécuter: COMMIT;
-- 
-- Si problème:
--   Exécuter: ROLLBACK;
-- 
-- NE PAS LAISSER LA TRANSACTION OUVERTE