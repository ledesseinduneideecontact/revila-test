-- =====================================================
-- Script pour vérifier la structure des tables
-- =====================================================

-- 1. Vérifier les colonnes de la table order_items
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- 2. Vérifier les colonnes de la table orders
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- 3. Afficher quelques exemples de order_items pour voir les données
SELECT * 
FROM order_items
LIMIT 5;

-- 4. Afficher quelques exemples de orders pour voir les données
SELECT * 
FROM orders
LIMIT 5;