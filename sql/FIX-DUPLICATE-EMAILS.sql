-- =========================================
-- CORRECTION DES EMAILS DUPLIQUÉS
-- =========================================
-- À exécuter AVANT PRAGMATIC-IMPROVEMENTS.sql

-- 1. VOIR LES EMAILS DUPLIQUÉS
SELECT 
    email,
    COUNT(*) as nombre_duplicatas,
    STRING_AGG(id::text, ', ') as customer_ids,
    STRING_AGG(first_name || ' ' || last_name, ', ') as noms,
    STRING_AGG(created_at::text, ', ') as dates_creation
FROM public.customers
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- 2. STRATÉGIE DE DÉDUPLICATION
-- On garde le client le plus récent (ou celui avec le plus de commandes)

-- Créer une table temporaire avec le meilleur client par email
WITH customer_orders_count AS (
    SELECT 
        c.id,
        c.email,
        c.created_at,
        COUNT(o.id) as order_count
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    GROUP BY c.id, c.email, c.created_at
),
best_customers AS (
    SELECT DISTINCT ON (email) 
        id as customer_to_keep,
        email
    FROM customer_orders_count
    ORDER BY email, order_count DESC, created_at DESC
)
SELECT * FROM best_customers;

-- 3. MISE À JOUR DES COMMANDES
-- Réassigner toutes les commandes vers le client conservé

WITH customer_orders_count AS (
    SELECT 
        c.id,
        c.email,
        c.created_at,
        COUNT(o.id) as order_count
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    GROUP BY c.id, c.email, c.created_at
),
best_customers AS (
    SELECT DISTINCT ON (email) 
        id as customer_to_keep,
        email
    FROM customer_orders_count
    ORDER BY email, order_count DESC, created_at DESC
),
customers_to_merge AS (
    SELECT 
        c.id as old_customer_id,
        bc.customer_to_keep as new_customer_id
    FROM customers c
    INNER JOIN best_customers bc ON c.email = bc.email
    WHERE c.id != bc.customer_to_keep
)
UPDATE orders o
SET customer_id = ctm.new_customer_id
FROM customers_to_merge ctm
WHERE o.customer_id = ctm.old_customer_id;

-- 4. FUSIONNER LES INFORMATIONS DES CLIENTS
-- Mettre à jour le client conservé avec les infos les plus complètes

WITH customer_orders_count AS (
    SELECT 
        c.id,
        c.email,
        c.created_at,
        COUNT(o.id) as order_count
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    GROUP BY c.id, c.email, c.created_at
),
best_customers AS (
    SELECT DISTINCT ON (email) 
        id as customer_to_keep,
        email
    FROM customer_orders_count
    ORDER BY email, order_count DESC, created_at DESC
),
merged_customer_info AS (
    SELECT 
        bc.customer_to_keep,
        COALESCE(NULLIF(MAX(c.first_name), ''), MAX(c.first_name)) as best_first_name,
        COALESCE(NULLIF(MAX(c.last_name), ''), MAX(c.last_name)) as best_last_name,
        COALESCE(NULLIF(MAX(c.phone), ''), MAX(c.phone)) as best_phone,
        COALESCE(NULLIF(MAX(c.address), ''), MAX(c.address)) as best_address,
        COALESCE(NULLIF(MAX(c.postal_code), ''), MAX(c.postal_code)) as best_postal_code,
        COALESCE(NULLIF(MAX(c.city), ''), MAX(c.city)) as best_city,
        COALESCE(NULLIF(MAX(c.country), ''), MAX(c.country)) as best_country
    FROM customers c
    INNER JOIN best_customers bc ON c.email = bc.email
    GROUP BY bc.customer_to_keep
)
UPDATE customers c
SET 
    first_name = COALESCE(c.first_name, mci.best_first_name),
    last_name = COALESCE(c.last_name, mci.best_last_name),
    phone = COALESCE(c.phone, mci.best_phone),
    address = COALESCE(c.address, mci.best_address),
    postal_code = COALESCE(c.postal_code, mci.best_postal_code),
    city = COALESCE(c.city, mci.best_city),
    country = COALESCE(c.country, mci.best_country)
FROM merged_customer_info mci
WHERE c.id = mci.customer_to_keep;

-- 5. SUPPRIMER LES DOUBLONS
-- Après avoir réassigné toutes les commandes

WITH customer_orders_count AS (
    SELECT 
        c.id,
        c.email,
        c.created_at,
        COUNT(o.id) as order_count
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    GROUP BY c.id, c.email, c.created_at
),
best_customers AS (
    SELECT DISTINCT ON (email) 
        id as customer_to_keep,
        email
    FROM customer_orders_count
    ORDER BY email, order_count DESC, created_at DESC
),
customers_to_delete AS (
    SELECT c.id
    FROM customers c
    INNER JOIN best_customers bc ON c.email = bc.email
    WHERE c.id != bc.customer_to_keep
)
DELETE FROM customers
WHERE id IN (SELECT id FROM customers_to_delete);

-- 6. VÉRIFICATION FINALE
SELECT 
    'Après déduplication' as status,
    COUNT(*) as total_customers,
    COUNT(DISTINCT email) as emails_uniques,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT email) 
        THEN '✅ Pas de doublons'
        ELSE '❌ Encore des doublons'
    END as verification
FROM customers;

-- 7. MAINTENANT ON PEUT AJOUTER LA CONTRAINTE UNIQUE
-- Cette ligne est commentée, elle sera exécutée dans PRAGMATIC-IMPROVEMENTS.sql
-- ALTER TABLE public.customers
-- ADD CONSTRAINT customers_email_unique UNIQUE (email);

-- =========================================
-- RÉSUMÉ DES ACTIONS
-- =========================================
-- 1. Identifie les emails dupliqués
-- 2. Garde le client avec le plus de commandes (ou le plus récent)
-- 3. Réassigne toutes les commandes au client conservé
-- 4. Fusionne les informations (prend les non-nulles)
-- 5. Supprime les doublons
-- 6. Vérifie qu'il n'y a plus de doublons
-- 
-- APRÈS CE SCRIPT : Exécuter PRAGMATIC-IMPROVEMENTS.sql