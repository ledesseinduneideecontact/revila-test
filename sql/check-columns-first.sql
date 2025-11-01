-- ============================================================
-- VÉRIFICATION DES COLONNES EXISTANTES
-- ============================================================

-- 1. COLONNES DE LA TABLE ORDERS
SELECT 
    'ORDERS - Colonnes existantes' as info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'orders'
ORDER BY ordinal_position;

-- 2. COLONNES DE LA TABLE CUSTOMERS
SELECT 
    'CUSTOMERS - Colonnes existantes' as info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'customers'
ORDER BY ordinal_position;

-- 3. COLONNES DE LA TABLE ORDER_ITEMS
SELECT 
    'ORDER_ITEMS - Colonnes existantes' as info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'order_items'
ORDER BY ordinal_position;