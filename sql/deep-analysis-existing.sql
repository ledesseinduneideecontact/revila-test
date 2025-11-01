-- ============================================================
-- ANALYSE APPROFONDIE DES TABLES EXISTANTES (PRODUCTION)
-- ============================================================
-- But: Comprendre exactement comment les commandes sont stockées
-- pour optimiser l'intégration avec le système de login
-- ============================================================

-- 1. STRUCTURE COMPLÈTE DE LA TABLE CUSTOMERS
SELECT 
    'CUSTOMERS - Structure complete' as analysis;
SELECT 
    ordinal_position,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'customers'
ORDER BY ordinal_position;

-- 2. STRUCTURE COMPLÈTE DE LA TABLE ORDERS
SELECT 
    'ORDERS - Structure complete' as analysis;
SELECT 
    ordinal_position,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'orders'
ORDER BY ordinal_position;

-- 3. STRUCTURE COMPLÈTE DE LA TABLE ORDER_ITEMS
SELECT 
    'ORDER_ITEMS - Structure complete' as analysis;
SELECT 
    ordinal_position,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'order_items'
ORDER BY ordinal_position;

-- 4. STRUCTURE DE WEBHOOK_EVENTS
SELECT 
    'WEBHOOK_EVENTS - Structure complete' as analysis;
SELECT 
    ordinal_position,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'webhook_events'
ORDER BY ordinal_position;

-- 5. ÉCHANTILLON DE DONNÉES CUSTOMERS (sans données sensibles)
SELECT 
    'CUSTOMERS - Echantillon donnees' as analysis;
SELECT 
    id,
    CASE WHEN email IS NOT NULL THEN 'HAS_EMAIL' ELSE 'NO_EMAIL' END as has_email,
    CASE WHEN first_name IS NOT NULL THEN 'HAS_NAME' ELSE 'NO_NAME' END as has_first_name,
    CASE WHEN phone IS NOT NULL THEN 'HAS_PHONE' ELSE 'NO_PHONE' END as has_phone,
    CASE WHEN user_id IS NOT NULL THEN 'LINKED_TO_USER' ELSE 'NOT_LINKED' END as user_link,
    CASE WHEN is_guest IS TRUE THEN 'GUEST' ELSE 'REGISTERED' END as account_type,
    created_at
FROM customers
ORDER BY created_at DESC
LIMIT 5;

-- 6. ÉCHANTILLON DE DONNÉES ORDERS
SELECT 
    'ORDERS - Echantillon donnees' as analysis;
SELECT 
    id,
    order_number,
    status,
    payment_status,
    total_amount,
    CASE WHEN stripe_payment_intent_id IS NOT NULL THEN 'HAS_STRIPE' ELSE 'NO_STRIPE' END as stripe_status,
    CASE WHEN user_id IS NOT NULL THEN 'LINKED_TO_USER' ELSE 'NOT_LINKED' END as user_link,
    created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- 7. ANALYSE DES COLONNES JSON/JSONB
SELECT 
    'COLONNES JSON/JSONB' as analysis,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND data_type IN ('json', 'jsonb')
ORDER BY table_name, column_name;

-- 8. ANALYSE DES STATUTS POSSIBLES
SELECT 
    'STATUTS ORDERS' as analysis,
    status,
    COUNT(*) as count
FROM orders
GROUP BY status
ORDER BY count DESC;

-- 9. ANALYSE DES PAYMENT_STATUS
SELECT 
    'PAYMENT STATUTS' as analysis,
    payment_status,
    COUNT(*) as count
FROM orders
GROUP BY payment_status
ORDER BY count DESC;

-- 10. VÉRIFICATION DES COLONNES DE LIAISON
SELECT 
    'COLONNES DE LIAISON ACTUELLES' as analysis;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('customers', 'orders', 'order_items')
AND column_name IN ('user_id', 'customer_id', 'order_id', 'saved_cart_id', 'is_guest')
ORDER BY table_name, column_name;

-- 11. STATISTIQUES GLOBALES
SELECT 
    'STATISTIQUES' as analysis;
SELECT 
    'Total Customers' as metric,
    COUNT(*)::text as value
FROM customers
UNION ALL
SELECT 
    'Customers avec user_id' as metric,
    COUNT(*)::text as value
FROM customers
WHERE user_id IS NOT NULL
UNION ALL
SELECT 
    'Total Orders' as metric,
    COUNT(*)::text as value
FROM orders
UNION ALL
SELECT 
    'Orders completees' as metric,
    COUNT(*)::text as value
FROM orders
WHERE status = 'completed'
UNION ALL
SELECT 
    'Total Order Items' as metric,
    COUNT(*)::text as value
FROM order_items;

-- 12. VÉRIFICATION DE L'INTÉGRATION
SELECT 
    'ETAT INTEGRATION' as analysis;
SELECT 
    'customers.user_id existe' as check_item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'user_id')
        THEN 'OUI'
        ELSE 'NON'
    END as status
UNION ALL
SELECT 
    'orders.user_id existe' as check_item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'user_id')
        THEN 'OUI'
        ELSE 'NON'
    END as status
UNION ALL
SELECT 
    'orders.saved_cart_id existe' as check_item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'saved_cart_id')
        THEN 'OUI'
        ELSE 'NON'
    END as status
UNION ALL
SELECT 
    'customers.is_guest existe' as check_item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'is_guest')
        THEN 'OUI'
        ELSE 'NON'
    END as status;