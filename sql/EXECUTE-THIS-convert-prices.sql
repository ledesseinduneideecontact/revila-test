-- =====================================================
-- SCRIPT FINAL DE CONVERSION DES PRIX EN CENTIMES
-- À EXÉCUTER DANS SUPABASE SQL EDITOR
-- =====================================================

-- ÉTAPE 1: Vérifier l'état actuel AVANT conversion
SELECT 
    'AVANT CONVERSION' as etape,
    COUNT(*) as nb_commandes,
    MIN(total_amount) as min_total,
    MAX(total_amount) as max_total,
    AVG(total_amount)::numeric(10,2) as moy_total
FROM orders
WHERE total_amount IS NOT NULL;

-- ÉTAPE 2: Démarrer la transaction
BEGIN;

-- ÉTAPE 3: Convertir les prix dans la table orders (multiplier par 100)
UPDATE orders 
SET 
    subtotal_amount = subtotal_amount * 100,
    total_amount = total_amount * 100,
    shipping_cost = shipping_cost * 100,
    discount_amount = discount_amount * 100
WHERE total_amount < 500;  -- Protection contre double conversion

-- ÉTAPE 4: Convertir les prix dans order_items (multiplier par 100)
UPDATE order_items 
SET unit_price = unit_price * 100
WHERE unit_price < 100;  -- Protection contre double conversion

-- ÉTAPE 5: Vérifier le résultat APRÈS conversion
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

-- Voir quelques exemples
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

-- =====================================================
-- IMPORTANT: VALIDATION FINALE
-- =====================================================
-- 
-- Vérifiez les résultats ci-dessus:
-- - Les totaux devraient être en centimes (ex: 2830 pour 28.30€)
-- - Les frais de port devraient être en centimes (ex: 299 pour 2.99€)
-- 
-- SI TOUT EST CORRECT:
-- Tapez: COMMIT;
-- 
-- SI PROBLÈME:
-- Tapez: ROLLBACK;
--
-- NE PAS FERMER LA FENÊTRE SANS COMMIT OU ROLLBACK !
-- =====================================================