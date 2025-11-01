-- =====================================================
-- Script de vérification des prix actuels
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

-- 2. Afficher des exemples de prix par format
SELECT DISTINCT
    format,
    with_frame,
    unit_price,
    unit_price / 100.0 as prix_si_centimes,
    CASE 
        WHEN unit_price < 100 THEN 'Probablement en EUROS'
        WHEN unit_price >= 100 AND unit_price < 10000 THEN 'Probablement en CENTIMES'
        ELSE 'Valeur anormale'
    END as diagnostic
FROM order_items
WHERE unit_price IS NOT NULL
ORDER BY format, with_frame, unit_price
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

-- 4. Comparer avec les prix attendus (en centimes)
-- Prix de référence selon pricing.ts convertis en centimes:
-- Carré: 750 centimes (7.50€)
-- 10x15: 950 centimes (9.50€)
-- 20x30: 1850 centimes (18.50€)
-- 30x45: 2450 centimes (24.50€)

SELECT 
    format,
    COUNT(*) as nb_items,
    MIN(unit_price) as min_price,
    MAX(unit_price) as max_price,
    AVG(unit_price)::numeric(10,2) as avg_price,
    CASE format
        WHEN 'carre' THEN '750 centimes (7.50€)'
        WHEN '10x15' THEN '950 centimes (9.50€)'
        WHEN '20x30' THEN '1850 centimes (18.50€)'
        WHEN '30x45' THEN '2450 centimes (24.50€)'
        ELSE 'Format inconnu'
    END as prix_attendu_sans_cadre
FROM order_items
WHERE unit_price IS NOT NULL
  AND with_frame = false
GROUP BY format
ORDER BY format;