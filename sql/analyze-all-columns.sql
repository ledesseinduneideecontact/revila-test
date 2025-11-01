-- ============================================================
-- ANALYSE COMPLÈTE DE TOUTES LES COLONNES DE TOUTES LES TABLES
-- ============================================================

-- 1. VUE D'ENSEMBLE : TOUTES LES TABLES ET LEUR NOMBRE DE COLONNES
SELECT 
    t.table_name,
    COUNT(c.column_name) as column_count,
    CASE 
        WHEN t.table_name IN ('customers', 'orders', 'order_items', 'webhook_events') THEN '🔵 Original'
        WHEN t.table_name IN ('user_profiles', 'saved_carts', 'saved_cart_items', 'cart_shares', 'cart_recovery_sessions') THEN '🟢 Auth'
        ELSE '⚪ Autre'
    END as category
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
GROUP BY t.table_name
ORDER BY category, t.table_name;

-- 2. DÉTAIL COMPLET : TOUTES LES COLONNES DE TOUTES LES TABLES
SELECT 
    c.table_name,
    c.ordinal_position as pos,
    c.column_name,
    c.data_type,
    c.character_maximum_length as max_len,
    c.is_nullable,
    c.column_default,
    CASE 
        WHEN c.column_name LIKE '%_id' THEN '🔗 FK?'
        WHEN c.column_name LIKE '%_at' THEN '📅 Timestamp'
        WHEN c.column_name IN ('id') THEN '🔑 PK'
        WHEN c.column_name IN ('email', 'phone') THEN '📧 Contact'
        WHEN c.column_name IN ('amount', 'price', 'total') THEN '💰 Money'
        ELSE ''
    END as type_hint
FROM information_schema.columns c
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- 3. ANALYSE PAR TABLE : CUSTOMERS
SELECT '========== TABLE: CUSTOMERS ==========' as section;
SELECT 
    ordinal_position as "#",
    column_name,
    data_type || COALESCE('(' || character_maximum_length || ')', '') as type,
    is_nullable as "null?",
    COALESCE(column_default, '') as default_value
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'customers'
ORDER BY ordinal_position;

-- 4. ANALYSE PAR TABLE : ORDERS
SELECT '========== TABLE: ORDERS ==========' as section;
SELECT 
    ordinal_position as "#",
    column_name,
    data_type || COALESCE('(' || character_maximum_length || ')', '') as type,
    is_nullable as "null?",
    COALESCE(column_default, '') as default_value
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;

-- 5. ANALYSE PAR TABLE : ORDER_ITEMS
SELECT '========== TABLE: ORDER_ITEMS ==========' as section;
SELECT 
    ordinal_position as "#",
    column_name,
    data_type || COALESCE('(' || character_maximum_length || ')', '') as type,
    is_nullable as "null?",
    COALESCE(column_default, '') as default_value
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'order_items'
ORDER BY ordinal_position;

-- 6. ANALYSE PAR TABLE : WEBHOOK_EVENTS
SELECT '========== TABLE: WEBHOOK_EVENTS ==========' as section;
SELECT 
    ordinal_position as "#",
    column_name,
    data_type || COALESCE('(' || character_maximum_length || ')', '') as type,
    is_nullable as "null?",
    COALESCE(column_default, '') as default_value
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'webhook_events'
ORDER BY ordinal_position;

-- 7. ANALYSE PAR TABLE : USER_PROFILES (si existe)
SELECT '========== TABLE: USER_PROFILES ==========' as section;
SELECT 
    ordinal_position as "#",
    column_name,
    data_type || COALESCE('(' || character_maximum_length || ')', '') as type,
    is_nullable as "null?",
    COALESCE(column_default, '') as default_value
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 8. ANALYSE PAR TABLE : SAVED_CARTS (si existe)
SELECT '========== TABLE: SAVED_CARTS ==========' as section;
SELECT 
    ordinal_position as "#",
    column_name,
    data_type || COALESCE('(' || character_maximum_length || ')', '') as type,
    is_nullable as "null?",
    COALESCE(column_default, '') as default_value
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'saved_carts'
ORDER BY ordinal_position;

-- 9. ANALYSE PAR TABLE : SAVED_CART_ITEMS (si existe)
SELECT '========== TABLE: SAVED_CART_ITEMS ==========' as section;
SELECT 
    ordinal_position as "#",
    column_name,
    data_type || COALESCE('(' || character_maximum_length || ')', '') as type,
    is_nullable as "null?",
    COALESCE(column_default, '') as default_value
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'saved_cart_items'
ORDER BY ordinal_position;

-- 10. ANALYSE DES RELATIONS (FOREIGN KEYS)
SELECT '========== RELATIONS (FOREIGN KEYS) ==========' as section;
SELECT 
    tc.table_name as "from_table",
    kcu.column_name as "from_column",
    '→' as " ",
    ccu.table_name AS "to_table",
    ccu.column_name AS "to_column"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 11. COLONNES DE LIAISON IMPORTANTES
SELECT '========== COLONNES DE LIAISON ==========' as section;
SELECT 
    table_name,
    column_name,
    data_type,
    CASE 
        WHEN column_name = 'user_id' THEN '👤 Lien utilisateur'
        WHEN column_name = 'customer_id' THEN '🛒 Lien client'
        WHEN column_name = 'order_id' THEN '📦 Lien commande'
        WHEN column_name = 'saved_cart_id' THEN '💾 Lien panier sauvé'
        WHEN column_name = 'is_guest' THEN '👻 Indicateur invité'
        ELSE '🔗 Autre lien'
    END as purpose
FROM information_schema.columns
WHERE table_schema = 'public' 
AND column_name IN ('user_id', 'customer_id', 'order_id', 'saved_cart_id', 'is_guest', 'cart_id')
ORDER BY table_name, column_name;

-- 12. COLONNES AVEC VALEURS PAR DÉFAUT
SELECT '========== COLONNES AVEC DEFAULTS ==========' as section;
SELECT 
    table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND column_default IS NOT NULL
ORDER BY table_name, column_name;

-- 13. COLONNES NULLABLE VS NON-NULLABLE
SELECT '========== ANALYSE NULLABLE ==========' as section;
SELECT 
    table_name,
    COUNT(*) FILTER (WHERE is_nullable = 'NO') as required_columns,
    COUNT(*) FILTER (WHERE is_nullable = 'YES') as optional_columns,
    COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

-- 14. TYPES DE DONNÉES UTILISÉS
SELECT '========== TYPES DE DONNÉES ==========' as section;
SELECT 
    data_type,
    COUNT(*) as usage_count,
    STRING_AGG(DISTINCT table_name, ', ') as used_in_tables
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY data_type
ORDER BY usage_count DESC;

-- 15. RÉSUMÉ FINAL
SELECT '========== RÉSUMÉ FINAL ==========' as section;
SELECT 
    'Total tables' as metric,
    COUNT(DISTINCT table_name)::text as value
FROM information_schema.tables
WHERE table_schema = 'public'
UNION ALL
SELECT 
    'Total colonnes' as metric,
    COUNT(*)::text as value
FROM information_schema.columns
WHERE table_schema = 'public'
UNION ALL
SELECT 
    'Colonnes avec FK' as metric,
    COUNT(DISTINCT kcu.column_name)::text as value
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
UNION ALL
SELECT 
    'Tables avec user_id' as metric,
    COUNT(DISTINCT table_name)::text as value
FROM information_schema.columns
WHERE table_schema = 'public' 
AND column_name = 'user_id';