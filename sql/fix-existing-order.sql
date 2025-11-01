-- Script pour réparer la commande REV-1755674513288-yor6yksvi
-- Exécuter dans Supabase SQL Editor

-- 1. D'abord, voir ce qu'on a
SELECT 
    o.id as order_id,
    o.order_number,
    o.customer_id,
    o.subtotal_amount,
    o.total_amount,
    c.id as customer_id_check,
    c.email,
    c.first_name,
    c.last_name,
    c.address,
    c.city
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
WHERE o.order_number = 'REV-1755674513288-yor6yksvi';

-- 2. Créer l'item manquant manuellement
-- (À adapter selon les vraies données de votre commande)
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
    created_at
)
SELECT 
    o.id as order_id,
    1 as item_number,
    '2025-01/' || o.id || '/photo-1.jpg' as photo_gcs_url,
    '2025-01/' || o.id || '/video-1.mp4' as video_gcs_url,
    'photo-1.jpg' as photo_filename,
    'video-1.mp4' as video_filename,
    1000000 as photo_size_bytes, -- 1MB estimé
    5000000 as video_size_bytes, -- 5MB estimé
    'image/jpeg' as photo_mime_type,
    'video/mp4' as video_mime_type,
    9.50 as unit_price, -- Prix photo 10x15
    'uploaded' as gcs_upload_status,
    NULL as message_text, -- À remplir si vous avez le message
    NULL as message_signature, -- À remplir si vous avez la signature
    'photo-10x15' as categorie,
    '10x15' as format,
    false as with_frame,
    1 as quantity,
    'photo' as item_type,
    false as cadeau,
    o.created_at
FROM orders o
WHERE o.order_number = 'REV-1755674513288-yor6yksvi'
AND NOT EXISTS (
    SELECT 1 FROM order_items oi WHERE oi.order_id = o.id
);

-- 3. Mettre à jour l'adresse du customer si elle manque
-- (Remplacez les valeurs par les vraies données)
UPDATE customers
SET 
    address = COALESCE(address, '123 Rue Example'),
    postal_code = COALESCE(postal_code, '75001'),
    city = COALESCE(city, 'Paris'),
    country = COALESCE(country, 'France')
WHERE id IN (
    SELECT customer_id FROM orders 
    WHERE order_number = 'REV-1755674513288-yor6yksvi'
)
AND address IS NULL;

-- 4. Vérifier que tout est réparé
SELECT 
    'VERIFICATION FINALE' as status,
    o.order_number,
    COUNT(oi.id) as items_count,
    c.email,
    c.address IS NOT NULL as has_address
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN customers c ON o.customer_id = c.id
WHERE o.order_number = 'REV-1755674513288-yor6yksvi'
GROUP BY o.order_number, c.email, c.address;