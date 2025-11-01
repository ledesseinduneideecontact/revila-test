-- =====================================================
-- CRÉATION DE NOUVELLES COLONNES EN CENTIMES
-- Solution alternative : garder les anciennes colonnes
-- et créer de nouvelles colonnes _cents
-- =====================================================

-- ÉTAPE 1: Ajouter les nouvelles colonnes dans orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS subtotal_cents INTEGER,
ADD COLUMN IF NOT EXISTS total_cents INTEGER,
ADD COLUMN IF NOT EXISTS shipping_cents INTEGER,
ADD COLUMN IF NOT EXISTS discount_cents INTEGER;

-- ÉTAPE 2: Ajouter la nouvelle colonne dans order_items
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS unit_price_cents INTEGER;

-- ÉTAPE 3: Remplir les nouvelles colonnes avec les valeurs en centimes
UPDATE orders 
SET 
    subtotal_cents = ROUND(subtotal_amount * 100)::INTEGER,
    total_cents = ROUND(total_amount * 100)::INTEGER,
    shipping_cents = ROUND(shipping_cost * 100)::INTEGER,
    discount_cents = ROUND(discount_amount * 100)::INTEGER
WHERE total_cents IS NULL;

UPDATE order_items 
SET unit_price_cents = ROUND(unit_price * 100)::INTEGER
WHERE unit_price_cents IS NULL;

-- ÉTAPE 4: Vérifier les résultats
SELECT 
    order_number,
    total_amount as total_euros,
    total_cents,
    shipping_cost as shipping_euros,
    shipping_cents,
    payment_status,
    created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- ÉTAPE 5: Vérifier order_items
SELECT 
    oi.id,
    oi.unit_price as price_euros,
    oi.unit_price_cents as price_cents,
    o.order_number
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
ORDER BY oi.created_at DESC
LIMIT 10;

-- =====================================================
-- AVANTAGES DE CETTE APPROCHE :
-- =====================================================
-- 1. Pas de modification des colonnes existantes
-- 2. Pas de risque de casser le code existant
-- 3. Migration progressive possible
-- 4. Possibilité de revenir en arrière facilement
-- 
-- Dans votre code TypeScript, utilisez :
-- - total_cents au lieu de total_amount * 100
-- - shipping_cents au lieu de shipping_cost * 100
-- - unit_price_cents au lieu de unit_price * 100
-- =====================================================