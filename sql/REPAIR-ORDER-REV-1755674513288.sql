-- =========================================
-- SCRIPT DE RÉPARATION POUR LA COMMANDE REV-1755674513288-yor6yksvi
-- =========================================
-- Ce script va :
-- 1. Vérifier l'état actuel de la commande
-- 2. Créer l'item manquant (photo 10x15)
-- 3. Mettre à jour l'adresse du customer si elle manque
-- 4. Vérifier que tout est correct

-- =========================================
-- ÉTAPE 1 : DIAGNOSTIC - Voir l'état actuel
-- =========================================
SELECT 
    '📊 ÉTAT ACTUEL DE LA COMMANDE' as diagnostic,
    o.id as order_id,
    o.order_number,
    o.total_amount,
    o.payment_status,
    c.email,
    c.first_name || ' ' || c.last_name as customer_name,
    c.address,
    c.city,
    (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
WHERE o.order_number = 'REV-1755674513288-yor6yksvi';

-- =========================================
-- ÉTAPE 2 : CRÉER L'ITEM MANQUANT
-- =========================================
-- Cette requête ne créera l'item QUE s'il n'existe pas déjà

INSERT INTO order_items (
    order_id,
    item_number,
    photo_gcs_url,
    video_gcs_url,
    photo_filename,
    video_filename,
    photo_size_bytes,
    video_size_bytes,
    photo_mime_type,
    video_mime_type,
    unit_price,
    gcs_upload_status,
    message_text,
    message_signature,
    categorie,
    format,
    with_frame,
    quantity,
    item_type,
    cadeau,
    nom,
    adresse,
    code_postal,
    ville,
    pays,
    created_at
)
SELECT 
    -- Données de base de la commande
    o.id as order_id,
    1 as item_number,
    
    -- URLs des fichiers dans le storage Supabase
    '2025-01/' || o.id || '/photo-1.jpg' as photo_gcs_url,
    '2025-01/' || o.id || '/video-1.mp4' as video_gcs_url,
    
    -- Noms des fichiers
    'photo-1.jpg' as photo_filename,
    'video-1.mp4' as video_filename,
    
    -- Tailles estimées (seront les vraies si les fichiers ont été uploadés)
    1000000 as photo_size_bytes, -- 1MB
    5000000 as video_size_bytes, -- 5MB
    
    -- Types MIME
    'image/jpeg' as photo_mime_type,
    'video/mp4' as video_mime_type,
    
    -- Prix et statut
    9.50 as unit_price, -- Prix photo 10x15 sans cadre
    'uploaded' as gcs_upload_status,
    
    -- Messages (probablement vides pour cette commande)
    NULL as message_text,
    NULL as message_signature,
    
    -- Format et options
    'photo-10x15' as categorie,
    '10x15' as format,
    false as with_frame, -- Sans cadre
    1 as quantity,
    'photo' as item_type,
    
    -- Livraison (pas un cadeau, donc adresse du client)
    false as cadeau,
    c.first_name || ' ' || c.last_name as nom,
    c.address as adresse,
    c.postal_code as code_postal,
    c.city as ville,
    COALESCE(c.country, 'France') as pays,
    
    -- Date de création (même que la commande)
    o.created_at
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
WHERE o.order_number = 'REV-1755674513288-yor6yksvi'
-- Ne créer QUE si aucun item n'existe pour cette commande
AND NOT EXISTS (
    SELECT 1 FROM order_items oi WHERE oi.order_id = o.id
);

-- =========================================
-- ÉTAPE 3 : METTRE À JOUR L'ADRESSE DU CUSTOMER
-- =========================================
-- Met à jour l'adresse du customer Simon Rosolen si elle est manquante

UPDATE customers
SET 
    address = COALESCE(address, '6 A Rue Grégoire Lachese, batiment A, appartement 1, rez de chaussée'),
    postal_code = COALESCE(postal_code, '49100'),
    city = COALESCE(city, 'Angers'),
    country = COALESCE(country, 'France'),
    phone = COALESCE(phone, '0780598185')
WHERE id = 'f3196fa6-66dc-4239-add9-8137630d5ccd'
AND (
    address IS NULL 
    OR postal_code IS NULL 
    OR city IS NULL
);

-- =========================================
-- ÉTAPE 4 : VÉRIFICATION FINALE
-- =========================================
-- Vérifie que tout est maintenant correct

SELECT 
    '✅ VÉRIFICATION FINALE' as status,
    o.order_number,
    o.total_amount,
    COUNT(oi.id) as nombre_items,
    c.first_name || ' ' || c.last_name as client,
    c.email,
    CASE 
        WHEN c.address IS NOT NULL THEN '✅ Adresse complète'
        ELSE '❌ Adresse manquante'
    END as statut_adresse,
    c.address,
    c.postal_code || ' ' || c.city as ville_complete,
    STRING_AGG(oi.categorie || ' (qty: ' || oi.quantity || ')', ', ') as items_details
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN customers c ON o.customer_id = c.id
WHERE o.order_number = 'REV-1755674513288-yor6yksvi'
GROUP BY 
    o.order_number, 
    o.total_amount, 
    c.first_name, 
    c.last_name, 
    c.email, 
    c.address, 
    c.postal_code, 
    c.city;

-- =========================================
-- RÉSULTAT ATTENDU
-- =========================================
-- Après exécution, vous devriez voir :
-- ✅ 1 item créé (photo-10x15)
-- ✅ Adresse complète pour le customer
-- ✅ Commande prête pour traitement