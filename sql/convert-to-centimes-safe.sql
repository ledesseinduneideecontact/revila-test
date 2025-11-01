-- =====================================================
-- Script SÉCURISÉ de conversion des prix en CENTIMES
-- Version corrigée sans référence à la colonne "format"
-- =====================================================

-- IMPORTANT: 
-- 1. Faire une sauvegarde avant d'exécuter ce script !
-- 2. Exécuter d'abord check-table-structure.sql pour voir les colonnes
-- 3. Exécuter verify-prices-fixed.sql pour analyser les prix actuels

BEGIN;

-- ================== ÉTAPE 1: ANALYSE AVANT CONVERSION ==================

-- Afficher l'état actuel des prix dans order_items
SELECT 
    'AVANT conversion - order_items' as status,
    COUNT(*) as nb_items,
    MIN(unit_price) as min_price,
    MAX(unit_price) as max_price,
    AVG(unit_price)::numeric(10,2) as avg_price,
    CASE 
        WHEN MAX(unit_price) < 100 THEN 'Prix en EUROS - Conversion nécessaire'
        WHEN MIN(unit_price) >= 100 THEN 'Prix déjà en CENTIMES - Ne pas convertir'
        ELSE 'Prix mixtes - Vérifier manuellement'
    END as diagnostic
FROM order_items
WHERE unit_price IS NOT NULL;

-- Afficher l'état actuel des totaux dans orders
SELECT 
    'AVANT conversion - orders' as status,
    COUNT(*) as nb_orders,
    MIN(total_amount) as min_total,
    MAX(total_amount) as max_total,
    AVG(total_amount)::numeric(10,2) as avg_total,
    CASE 
        WHEN MAX(total_amount) < 500 THEN 'Totaux en EUROS - Conversion nécessaire'
        WHEN MIN(total_amount) >= 500 THEN 'Totaux déjà en CENTIMES - Ne pas convertir'
        ELSE 'Totaux mixtes - Vérifier manuellement'
    END as diagnostic
FROM orders
WHERE total_amount IS NOT NULL;

-- ================== ÉTAPE 2: CONVERSION CONDITIONNELLE ==================

-- Convertir unit_price dans order_items (multiplier par 100)
-- Protection: ne convertir que si les prix sont < 100 (en euros)
UPDATE order_items 
SET unit_price = unit_price * 100
WHERE unit_price IS NOT NULL 
  AND unit_price < 100;  -- Protection contre double conversion

-- Afficher le nombre de lignes modifiées
SELECT 
    'order_items convertis' as action,
    COUNT(*) as lignes_modifiees
FROM order_items
WHERE unit_price IS NOT NULL 
  AND unit_price >= 100
  AND unit_price < 10000;  -- Prix nouvellement convertis

-- Convertir total_amount dans orders
UPDATE orders 
SET total_amount = total_amount * 100
WHERE total_amount IS NOT NULL 
  AND total_amount < 500;  -- Protection (une commande min est > 5€)

-- Convertir shipping_cost dans orders (si la colonne existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'shipping_cost'
    ) THEN
        UPDATE orders 
        SET shipping_cost = shipping_cost * 100
        WHERE shipping_cost IS NOT NULL 
          AND shipping_cost < 50;  -- Frais de port max ~50€
    END IF;
END $$;

-- Convertir discount_amount dans orders (si la colonne existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'discount_amount'
    ) THEN
        UPDATE orders 
        SET discount_amount = discount_amount * 100
        WHERE discount_amount IS NOT NULL 
          AND discount_amount < 100;
    END IF;
END $$;

-- ================== ÉTAPE 3: VÉRIFICATION APRÈS CONVERSION ==================

-- Vérifier les prix après conversion dans order_items
SELECT 
    'APRÈS conversion - order_items' as status,
    COUNT(*) as nb_items,
    MIN(unit_price) as min_price_centimes,
    MAX(unit_price) as max_price_centimes,
    AVG(unit_price)::numeric(10,2) as avg_price_centimes,
    (MIN(unit_price) / 100.0)::numeric(10,2) as min_price_euros,
    (MAX(unit_price) / 100.0)::numeric(10,2) as max_price_euros,
    (AVG(unit_price) / 100.0)::numeric(10,2) as avg_price_euros
FROM order_items
WHERE unit_price IS NOT NULL;

-- Vérifier les totaux après conversion dans orders
SELECT 
    'APRÈS conversion - orders' as status,
    COUNT(*) as nb_orders,
    MIN(total_amount) as min_total_centimes,
    MAX(total_amount) as max_total_centimes,
    AVG(total_amount)::numeric(10,2) as avg_total_centimes,
    (MIN(total_amount) / 100.0)::numeric(10,2) as min_total_euros,
    (MAX(total_amount) / 100.0)::numeric(10,2) as max_total_euros,
    (AVG(total_amount) / 100.0)::numeric(10,2) as avg_total_euros
FROM orders
WHERE total_amount IS NOT NULL;

-- ================== ÉTAPE 4: EXEMPLES POUR VALIDATION ==================

-- Afficher 10 exemples récents pour vérification manuelle
SELECT 
    oi.id,
    oi.order_id,
    oi.unit_price as prix_centimes,
    (oi.unit_price / 100.0)::numeric(10,2) as prix_euros,
    o.order_number,
    o.total_amount as total_centimes,
    (o.total_amount / 100.0)::numeric(10,2) as total_euros,
    o.created_at
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE oi.unit_price IS NOT NULL
ORDER BY o.created_at DESC
LIMIT 10;

-- ================== ÉTAPE 5: VALIDATION FINALE ==================

-- Distribution des prix pour validation
SELECT 
    CASE 
        WHEN unit_price < 100 THEN 'Moins de 100 (ERREUR si après conversion)'
        WHEN unit_price >= 100 AND unit_price < 500 THEN '100-500 centimes (1-5€)'
        WHEN unit_price >= 500 AND unit_price < 1000 THEN '500-1000 centimes (5-10€)'
        WHEN unit_price >= 1000 AND unit_price < 2000 THEN '1000-2000 centimes (10-20€)'
        WHEN unit_price >= 2000 AND unit_price < 5000 THEN '2000-5000 centimes (20-50€)'
        ELSE '5000+ centimes (50€+)'
    END as price_range,
    COUNT(*) as count,
    (MIN(unit_price) / 100.0)::numeric(10,2) as min_euros,
    (MAX(unit_price) / 100.0)::numeric(10,2) as max_euros,
    (AVG(unit_price) / 100.0)::numeric(10,2) as avg_euros
FROM order_items
WHERE unit_price IS NOT NULL
GROUP BY 1
ORDER BY MIN(unit_price);

-- ================== DÉCISION FINALE ==================
-- SI TOUT EST OK (prix en centimes cohérents):
--   Décommenter la ligne suivante pour valider
-- COMMIT;

-- SI PROBLÈME (prix incohérents ou erreurs):
--   Décommenter la ligne suivante pour annuler
-- ROLLBACK;

-- Par défaut, on reste en mode preview (ni commit ni rollback)
-- Vous devez choisir explicitement COMMIT ou ROLLBACK