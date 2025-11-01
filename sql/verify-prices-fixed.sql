-- =====================================================
-- Script de vérification des prix actuels (CORRIGÉ)
-- Pour diagnostiquer si les prix sont en euros ou centimes
-- =====================================================

-- 1. Vérifier les prix dans order_items
SELECT 
    'order_items' as table_name,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN unit_price < 100 THEN 1 END) as prices_under_100,
    COUNT(CASE WHEN unit_price >= 100 AND unit_price < 10000 THEN 1 END) as prices_100_to_10000,
    COUNT(CASE WHEN unit_price >= 10000 THEN 1 END) as prices_over_10000,
    MIN(unit_price) as min_price,
    MAX(unit_price) as max_price,
    AVG(unit_price)::numeric(10,2) as avg_price
FROM order_items
WHERE unit_price IS NOT NULL;

-- 2. Afficher des exemples de prix
SELECT DISTINCT
    unit_price,
    unit_price / 100.0 as prix_si_centimes,
    CASE 
        WHEN unit_price < 100 THEN 'Probablement en EUROS'
        WHEN unit_price >= 100 AND unit_price < 10000 THEN 'Probablement en CENTIMES'
        ELSE 'Valeur anormale'
    END as diagnostic
FROM order_items
WHERE unit_price IS NOT NULL
ORDER BY unit_price
LIMIT 20;

-- 3. Vérifier les totaux dans orders
SELECT 
    'orders' as table_name,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN total_amount < 100 THEN 1 END) as totals_under_100,
    COUNT(CASE WHEN total_amount >= 100 AND total_amount < 50000 THEN 1 END) as totals_100_to_50000,
    COUNT(CASE WHEN total_amount >= 50000 THEN 1 END) as totals_over_50000,
    MIN(total_amount) as min_total,
    MAX(total_amount) as max_total,
    AVG(total_amount)::numeric(10,2) as avg_total
FROM orders
WHERE total_amount IS NOT NULL;

-- 4. Analyser la distribution des prix unitaires
SELECT 
    CASE 
        WHEN unit_price < 10 THEN '0-10 (euros probable)'
        WHEN unit_price >= 10 AND unit_price < 50 THEN '10-50 (euros probable)'
        WHEN unit_price >= 50 AND unit_price < 100 THEN '50-100 (euros ou petits centimes)'
        WHEN unit_price >= 100 AND unit_price < 1000 THEN '100-1000 (centimes probable)'
        WHEN unit_price >= 1000 AND unit_price < 5000 THEN '1000-5000 (centimes probable)'
        ELSE '5000+ (centimes ou erreur)'
    END as price_range,
    COUNT(*) as count,
    MIN(unit_price) as min_in_range,
    MAX(unit_price) as max_in_range,
    AVG(unit_price)::numeric(10,2) as avg_in_range
FROM order_items
WHERE unit_price IS NOT NULL
GROUP BY 1
ORDER BY MIN(unit_price);

-- 5. Exemples récents avec détails
SELECT 
    oi.id,
    oi.order_id,
    oi.unit_price,
    oi.unit_price / 100.0 as prix_euros_si_centimes,
    o.order_number,
    o.total_amount,
    o.created_at
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE oi.unit_price IS NOT NULL
ORDER BY o.created_at DESC
LIMIT 10;