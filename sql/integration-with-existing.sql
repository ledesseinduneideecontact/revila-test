-- ============================================================
-- INTÉGRATION OPTIMALE AVEC LES TABLES EXISTANTES
-- ============================================================
-- Adaptation aux colonnes réelles de votre base de données
-- ============================================================

-- 1. VÉRIFIER TOUTES LES COLONNES DES 3 TABLES PRINCIPALES
SELECT 'STRUCTURE COMPLETE' as section;

-- Table ORDERS
SELECT 
    'ORDERS' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'orders'
ORDER BY ordinal_position;

-- Table CUSTOMERS
SELECT 
    'CUSTOMERS' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'customers'
ORDER BY ordinal_position;

-- Table ORDER_ITEMS (on l'a déjà mais pour référence)
SELECT 
    'ORDER_ITEMS' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'order_items'
ORDER BY ordinal_position;

-- 2. AJOUTER LES COLONNES MANQUANTES POUR L'INTÉGRATION

-- Pour ORDER_ITEMS, ajouter les colonnes format et quantité si nécessaire
DO $$
BEGIN
    -- Ajouter format (pour carre, 10x15, etc.)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'format'
    ) THEN
        ALTER TABLE order_items ADD COLUMN format VARCHAR(20);
        RAISE NOTICE 'Colonne format ajoutée à order_items';
    END IF;

    -- Ajouter with_frame
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'with_frame'
    ) THEN
        ALTER TABLE order_items ADD COLUMN with_frame BOOLEAN DEFAULT false;
        RAISE NOTICE 'Colonne with_frame ajoutée à order_items';
    END IF;

    -- Ajouter quantity
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'quantity'
    ) THEN
        ALTER TABLE order_items ADD COLUMN quantity INTEGER DEFAULT 1;
        RAISE NOTICE 'Colonne quantity ajoutée à order_items';
    END IF;
END $$;

-- 3. FONCTION DE CONVERSION saved_cart → order
CREATE OR REPLACE FUNCTION convert_saved_cart_to_order(
    p_saved_cart_id UUID,
    p_customer_id UUID,
    p_payment_intent_id TEXT,
    p_total_amount DECIMAL
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_user_id UUID;
    v_order_number TEXT;
BEGIN
    -- Générer un numéro de commande
    SELECT 'REV-' || TO_CHAR(NOW(), 'YYYY-MM-DD-') || 
           LPAD(COALESCE(MAX(SUBSTRING(order_number FROM 15 FOR 4)::INT) + 1, 1)::TEXT, 4, '0')
    INTO v_order_number
    FROM orders
    WHERE order_number LIKE 'REV-' || TO_CHAR(NOW(), 'YYYY-MM-DD-') || '%';

    -- Récupérer le user_id du saved_cart
    SELECT user_id INTO v_user_id FROM saved_carts WHERE id = p_saved_cart_id;

    -- Créer la commande dans orders
    INSERT INTO orders (
        id,
        customer_id,
        user_id,
        saved_cart_id,
        order_number,
        stripe_payment_intent_id,
        total_amount,
        payment_status,
        created_at
    ) VALUES (
        gen_random_uuid(),
        p_customer_id,
        v_user_id,
        p_saved_cart_id,
        v_order_number,
        p_payment_intent_id,
        p_total_amount,
        'paid',
        NOW()
    ) RETURNING id INTO v_order_id;

    -- Copier les items du saved_cart vers order_items
    INSERT INTO order_items (
        id,
        order_id,
        item_number,
        format,
        with_frame,
        quantity,
        photo_gcs_url,
        video_gcs_url,
        photo_filename,
        video_filename,
        message_text,
        message_signature,
        cadeau,
        nom,
        adresse,
        code_postal,
        ville,
        unit_price,
        categorie,
        created_at
    )
    SELECT 
        gen_random_uuid(),
        v_order_id,
        'ITEM-' || ROW_NUMBER() OVER (ORDER BY sci.position),
        sci.format,
        sci.with_frame,
        sci.quantity,
        sci.photo_url,
        sci.video_url,
        sci.photo_original_name,
        sci.video_original_name,
        sci.message,
        sci.signature,
        sci.is_gift,
        sci.gift_first_name || ' ' || sci.gift_last_name,
        sci.gift_address,
        sci.gift_postal_code,
        sci.gift_city,
        CASE 
            WHEN sci.format = 'carre' THEN 9.00
            WHEN sci.format = '10x15' AND sci.with_frame THEN 27.50
            WHEN sci.format = '10x15' THEN 9.50
            WHEN sci.format = '20x30' AND sci.with_frame THEN 59.90
            WHEN sci.format = '20x30' THEN 24.90
            WHEN sci.format = '30x45' AND sci.with_frame THEN 94.90
            WHEN sci.format = '30x45' THEN 39.90
        END,
        'photo_nfc',
        NOW()
    FROM saved_cart_items sci
    WHERE sci.cart_id = p_saved_cart_id;

    -- Marquer le saved_cart comme inactif
    UPDATE saved_carts 
    SET is_active = false, updated_at = NOW()
    WHERE id = p_saved_cart_id;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- 4. FONCTION POUR CRÉER UNE COMMANDE DIRECTE (sans saved_cart)
CREATE OR REPLACE FUNCTION create_direct_order(
    p_customer_id UUID,
    p_user_id UUID,
    p_payment_intent_id TEXT,
    p_total_amount DECIMAL
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
BEGIN
    -- Générer un numéro de commande
    SELECT 'REV-' || TO_CHAR(NOW(), 'YYYY-MM-DD-') || 
           LPAD(COALESCE(MAX(SUBSTRING(order_number FROM 15 FOR 4)::INT) + 1, 1)::TEXT, 4, '0')
    INTO v_order_number
    FROM orders
    WHERE order_number LIKE 'REV-' || TO_CHAR(NOW(), 'YYYY-MM-DD-') || '%';

    -- Créer la commande
    INSERT INTO orders (
        id,
        customer_id,
        user_id,
        order_number,
        stripe_payment_intent_id,
        total_amount,
        payment_status,
        created_at
    ) VALUES (
        gen_random_uuid(),
        p_customer_id,
        p_user_id,
        v_order_number,
        p_payment_intent_id,
        p_total_amount,
        'paid',
        NOW()
    ) RETURNING id INTO v_order_id;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- 5. VUE POUR VOIR LES COMMANDES AVEC DÉTAILS
CREATE OR REPLACE VIEW order_details_view AS
SELECT 
    o.id as order_id,
    o.order_number,
    o.total_amount,
    o.payment_status,
    o.created_at as order_date,
    c.email as customer_email,
    c.first_name || ' ' || c.last_name as customer_name,
    CASE WHEN o.user_id IS NOT NULL THEN 'Compte' ELSE 'Invité' END as customer_type,
    COUNT(oi.id) as items_count,
    STRING_AGG(
        COALESCE(oi.format, 'N/A') || 
        CASE WHEN oi.with_frame THEN ' (avec cadre)' ELSE '' END || 
        ' x' || COALESCE(oi.quantity::text, '1'),
        ', '
    ) as items_summary
FROM orders o
JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.total_amount, o.payment_status, o.created_at, 
         c.email, c.first_name, c.last_name, o.user_id;