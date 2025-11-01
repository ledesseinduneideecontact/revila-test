-- ============================================================
-- AFFICHER LES COLONNES DE ORDERS ET CUSTOMERS
-- ============================================================

-- 1. COLONNES DE ORDERS
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'orders'
ORDER BY ordinal_position;

-- 2. COLONNES DE CUSTOMERS  
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'customers'
ORDER BY ordinal_position;