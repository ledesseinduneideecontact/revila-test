-- Diagnostic de la commande REV-1755674513288-yor6yksvi
-- Exécuter dans Supabase SQL Editor

-- 1. Voir les détails de la commande
SELECT 
    'COMMANDE' as type,
    id,
    order_number,
    customer_id,
    shipping_address,
    shipping_city,
    shipping_postal_code,
    total_amount,
    payment_status,
    payment_intent_id,
    created_at
FROM orders 
WHERE order_number = 'REV-1755674513288-yor6yksvi';

-- 2. Voir les items de cette commande (s'il y en a)
SELECT 
    'ITEMS' as type,
    oi.*
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.order_number = 'REV-1755674513288-yor6yksvi';

-- 3. Voir le client associé
SELECT 
    'CLIENT' as type,
    c.*
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.order_number = 'REV-1755674513288-yor6yksvi';

-- 4. Vérifier s'il y a des erreurs dans les logs récents
SELECT 
    'ORDERS RECENTES' as type,
    order_number,
    created_at,
    payment_status,
    (SELECT COUNT(*) FROM order_items WHERE order_id = orders.id) as items_count
FROM orders
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 5;