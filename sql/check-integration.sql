-- ============================================================
-- VÉRIFICATION DE L'INTÉGRATION DU SYSTÈME D'AUTHENTIFICATION
-- ============================================================

-- 1. TABLES AVEC user_id
SELECT 
    '✅ Tables avec user_id:' as status,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND column_name = 'user_id'
ORDER BY table_name;

-- 2. TABLES AVEC saved_cart_id
SELECT 
    '✅ Tables avec saved_cart_id:' as status,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND column_name = 'saved_cart_id'
ORDER BY table_name;

-- 3. VÉRIFIER L'INTÉGRATION COMPLÈTE
SELECT 
    table_name,
    MAX(CASE WHEN column_name = 'user_id' THEN '✅' ELSE '❌' END) as has_user_id,
    MAX(CASE WHEN column_name = 'saved_cart_id' THEN '✅' ELSE '❌' END) as has_saved_cart_id,
    MAX(CASE WHEN column_name = 'is_guest' THEN '✅' ELSE '❌' END) as has_is_guest,
    MAX(CASE WHEN column_name = 'customer_id' THEN '✅' ELSE '❌' END) as has_customer_id,
    MAX(CASE WHEN column_name = 'order_id' THEN '✅' ELSE '❌' END) as has_order_id
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('customers', 'orders', 'order_items', 'saved_carts', 'saved_cart_items', 'user_profiles')
GROUP BY table_name
ORDER BY 
    CASE table_name
        WHEN 'user_profiles' THEN 1
        WHEN 'customers' THEN 2
        WHEN 'orders' THEN 3
        WHEN 'order_items' THEN 4
        WHEN 'saved_carts' THEN 5
        WHEN 'saved_cart_items' THEN 6
    END;

-- 4. VÉRIFIER LES FOREIGN KEYS
SELECT 
    '🔗 Relations FK:' as type,
    tc.table_name || '.' || kcu.column_name as source,
    '→' as arrow,
    ccu.table_name || '.' || ccu.column_name as target
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('customers', 'orders', 'order_items', 'saved_carts', 'saved_cart_items')
ORDER BY tc.table_name, kcu.column_name;

-- 5. COMPTER LES DONNÉES LIÉES
SELECT 
    '📊 Données liées:' as category,
    'Customers avec user_id' as metric,
    COUNT(*) FILTER (WHERE user_id IS NOT NULL) as linked,
    COUNT(*) FILTER (WHERE user_id IS NULL) as not_linked,
    COUNT(*) as total
FROM customers
UNION ALL
SELECT 
    '📊 Données liées:' as category,
    'Orders avec user_id' as metric,
    COUNT(*) FILTER (WHERE user_id IS NOT NULL) as linked,
    COUNT(*) FILTER (WHERE user_id IS NULL) as not_linked,
    COUNT(*) as total
FROM orders
UNION ALL
SELECT 
    '📊 Données liées:' as category,
    'Orders avec saved_cart_id' as metric,
    COUNT(*) FILTER (WHERE saved_cart_id IS NOT NULL) as linked,
    COUNT(*) FILTER (WHERE saved_cart_id IS NULL) as not_linked,
    COUNT(*) as total
FROM orders;

-- 6. LISTE DES 11 TABLES
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('customers', 'orders', 'order_items') THEN '🛒 Commerce'
        WHEN table_name IN ('webhook_events') THEN '🔔 Webhooks'
        WHEN table_name IN ('user_profiles', 'saved_carts', 'saved_cart_items', 'cart_shares', 'cart_recovery_sessions') THEN '👤 Auth/Cart'
        ELSE '📦 Autre'
    END as category,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY category, table_name;

-- 7. ÉTAT FINAL DE L'INTÉGRATION
SELECT 
    '🎯 ÉTAT DE L\'INTÉGRATION' as summary,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'user_id')
        THEN '✅ customers.user_id existe'
        ELSE '❌ customers.user_id manque'
    END as customers_status
UNION ALL
SELECT 
    '🎯 ÉTAT DE L\'INTÉGRATION' as summary,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'user_id')
        THEN '✅ orders.user_id existe'
        ELSE '❌ orders.user_id manque'
    END as orders_status
UNION ALL
SELECT 
    '🎯 ÉTAT DE L\'INTÉGRATION' as summary,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'saved_cart_id')
        THEN '✅ orders.saved_cart_id existe'
        ELSE '❌ orders.saved_cart_id manque'
    END as saved_cart_status
UNION ALL
SELECT 
    '🎯 ÉTAT DE L\'INTÉGRATION' as summary,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'is_guest')
        THEN '✅ customers.is_guest existe'
        ELSE '❌ customers.is_guest manque'
    END as guest_status;