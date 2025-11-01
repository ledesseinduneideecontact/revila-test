-- ============================================================
-- SCRIPT D'ANALYSE DES TABLES EXISTANTES
-- ============================================================
-- Ce script analyse la structure actuelle de toutes les tables
-- pour comprendre l'état de la base de données
-- ============================================================

-- 1. LISTER TOUTES LES TABLES PUBLIQUES
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('customers', 'orders', 'order_items', 'webhook_events') THEN 'Table originale'
        WHEN table_name IN ('user_profiles', 'saved_carts', 'saved_cart_items', 'cart_shares', 'cart_recovery_sessions') THEN 'Table auth'
        ELSE 'Autre'
    END as category
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY category, table_name;

-- 2. ANALYSER LA STRUCTURE DE CHAQUE TABLE IMPORTANTE
-- Table CUSTOMERS
SELECT 
    '--- TABLE: CUSTOMERS ---' as info,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'customers'
ORDER BY ordinal_position;

-- Table ORDERS
SELECT 
    '--- TABLE: ORDERS ---' as info,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'orders'
ORDER BY ordinal_position;

-- Table ORDER_ITEMS
SELECT 
    '--- TABLE: ORDER_ITEMS ---' as info,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'order_items'
ORDER BY ordinal_position;

-- Table WEBHOOK_EVENTS
SELECT 
    '--- TABLE: WEBHOOK_EVENTS ---' as info,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'webhook_events'
ORDER BY ordinal_position;

-- Table USER_PROFILES (si elle existe)
SELECT 
    '--- TABLE: USER_PROFILES ---' as info,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Table SAVED_CARTS (si elle existe)
SELECT 
    '--- TABLE: SAVED_CARTS ---' as info,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'saved_carts'
ORDER BY ordinal_position;

-- 3. VÉRIFIER LES CLÉS ÉTRANGÈRES
SELECT 
    '--- FOREIGN KEYS ---' as info,
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 4. VÉRIFIER LES INDEX
SELECT 
    '--- INDEXES ---' as info,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. VÉRIFIER LES POLICIES RLS
SELECT 
    '--- RLS POLICIES ---' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. STATISTIQUES DES DONNÉES
SELECT 
    '--- DATA STATS ---' as info,
    'customers' as table_name, COUNT(*) as row_count FROM customers
UNION ALL
SELECT 
    '--- DATA STATS ---' as info,
    'orders' as table_name, COUNT(*) as row_count FROM orders
UNION ALL
SELECT 
    '--- DATA STATS ---' as info,
    'order_items' as table_name, COUNT(*) as row_count FROM order_items
UNION ALL
SELECT 
    '--- DATA STATS ---' as info,
    'webhook_events' as table_name, COUNT(*) as row_count FROM webhook_events;

-- 7. VÉRIFIER SI LES COLONNES DE LIAISON EXISTENT
SELECT 
    '--- COLONNES DE LIAISON AUTH ---' as info,
    table_name,
    column_name,
    'EXISTS' as status
FROM information_schema.columns
WHERE table_schema = 'public' 
AND (
    (table_name = 'customers' AND column_name IN ('user_id', 'is_guest'))
    OR (table_name = 'orders' AND column_name IN ('user_id', 'saved_cart_id'))
)
ORDER BY table_name, column_name;

-- 8. VÉRIFIER L'ÉTAT DES TRIGGERS
SELECT 
    '--- TRIGGERS ---' as info,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 9. RÉSUMÉ RAPIDE
SELECT 
    '=== RÉSUMÉ ===' as info,
    'Tables totales' as metric,
    COUNT(*) as value
FROM information_schema.tables
WHERE table_schema = 'public'
UNION ALL
SELECT 
    '=== RÉSUMÉ ===' as info,
    'Tables avec RLS' as metric,
    COUNT(DISTINCT tablename) as value
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT 
    '=== RÉSUMÉ ===' as info,
    'Triggers actifs' as metric,
    COUNT(*) as value
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- 10. VÉRIFIER LES PERMISSIONS
SELECT 
    '--- PERMISSIONS ---' as info,
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND grantee NOT IN ('postgres', 'supabase_admin')
ORDER BY table_name, grantee, privilege_type;