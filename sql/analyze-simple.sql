-- ============================================================
-- ANALYSE SIMPLE - EXÉCUTER CHAQUE SECTION SÉPARÉMENT
-- ============================================================

-- SECTION 1: Lister toutes les tables
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('customers', 'orders', 'order_items', 'webhook_events') THEN 'Original'
        WHEN table_name IN ('user_profiles', 'saved_carts', 'saved_cart_items') THEN 'Auth'
        ELSE 'Autre'
    END as type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY type, table_name;

-- SECTION 2: Analyser la table CUSTOMERS
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'customers'
ORDER BY ordinal_position;

-- SECTION 3: Analyser la table ORDERS
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'orders'
ORDER BY ordinal_position;

-- SECTION 4: Vérifier les colonnes de liaison
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND column_name IN ('user_id', 'saved_cart_id', 'is_guest')
AND table_name IN ('customers', 'orders')
ORDER BY table_name, column_name;

-- SECTION 5: Compter les lignes
SELECT 
    'customers' as table_name, 
    COUNT(*) as count 
FROM customers
UNION ALL
SELECT 
    'orders' as table_name, 
    COUNT(*) as count 
FROM orders
UNION ALL
SELECT 
    'order_items' as table_name, 
    COUNT(*) as count 
FROM order_items;

-- SECTION 6: Vérifier si user_profiles existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
) as user_profiles_exists;

-- SECTION 7: Vérifier les clés étrangères sur customers et orders
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('customers', 'orders', 'order_items')
ORDER BY tc.table_name, kcu.column_name;