-- =====================================================
-- SCRIPT COMPLET: SUPPRESSION TRIGGER + CONVERSION PRIX
-- À EXÉCUTER DANS SUPABASE SQL EDITOR
-- =====================================================

-- ÉTAPE 1: Supprimer le trigger problématique
DROP TRIGGER IF EXISTS recalculate_order_totals_trigger ON order_items;
DROP FUNCTION IF EXISTS recalculate_order_totals() CASCADE;

-- ÉTAPE 2: Vérifier l'état actuel AVANT conversion
SELECT 
    'AVANT CONVERSION' as etape,
    COUNT(*) as nb_commandes,
    MIN(total_amount) as min_total,
    MAX(total_amount) as max_total,
    AVG(total_amount)::numeric(10,2) as moy_total
FROM orders
WHERE total_amount IS NOT NULL;

-- ÉTAPE 3: Démarrer la transaction
BEGIN;

-- ÉTAPE 4: Convertir les prix dans la table orders (multiplier par 100)
UPDATE orders 
SET 
    subtotal_amount = subtotal_amount * 100,
    total_amount = total_amount * 100,
    shipping_cost = shipping_cost * 100,
    discount_amount = discount_amount * 100
WHERE total_amount < 500;  -- Protection contre double conversion

-- ÉTAPE 5: Convertir les prix dans order_items (multiplier par 100)
UPDATE order_items 
SET unit_price = unit_price * 100
WHERE unit_price < 100;  -- Protection contre double conversion

-- ÉTAPE 6: Vérifier le résultat APRÈS conversion
SELECT 
    'APRÈS CONVERSION' as etape,
    COUNT(*) as nb_commandes,
    MIN(total_amount) as min_centimes,
    MAX(total_amount) as max_centimes,
    ROUND(MIN(total_amount)/100.0, 2) as min_euros,
    ROUND(MAX(total_amount)/100.0, 2) as max_euros,
    ROUND(AVG(total_amount)/100.0, 2) as moy_euros
FROM orders
WHERE total_amount IS NOT NULL;

-- ÉTAPE 7: Voir quelques exemples
SELECT 
    order_number,
    total_amount as total_centimes,
    ROUND(total_amount/100.0, 2) as total_euros,
    shipping_cost as shipping_centimes,
    ROUND(shipping_cost/100.0, 2) as shipping_euros,
    payment_status,
    created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- ÉTAPE 8: Vérifier aussi order_items
SELECT 
    COUNT(*) as nb_items,
    MIN(unit_price) as min_price_centimes,
    MAX(unit_price) as max_price_centimes,
    ROUND(AVG(unit_price)/100.0, 2) as moy_price_euros
FROM order_items
WHERE unit_price IS NOT NULL;

-- =====================================================
-- VALIDATION FINALE
-- =====================================================
-- 
-- Vérifiez les résultats:
-- - Les totaux en centimes (ex: 2830 pour 28.30€)
-- - Les frais de port en centimes (ex: 299 pour 2.99€)
-- - Les prix unitaires en centimes (ex: 950 pour 9.50€)
-- 
-- SI TOUT EST OK:
-- Tapez: COMMIT;
-- 
-- SI PROBLÈME:
-- Tapez: ROLLBACK;
-- =====================================================