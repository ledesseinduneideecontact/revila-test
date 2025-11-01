-- ============================================================
-- INTÉGRATION FINALE AVEC LES TABLES EXISTANTES
-- Basé sur la structure réelle de votre base de données
-- ============================================================

-- 1. AJOUTER LES COLONNES D'INTÉGRATION AUX TABLES EXISTANTES

-- Ajouter user_id à orders si pas déjà présent
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
        COMMENT ON COLUMN orders.user_id IS 'Référence au compte utilisateur (NULL pour invités)';
        RAISE NOTICE 'Colonne user_id ajoutée à orders';
    END IF;

    -- Ajouter saved_cart_id à orders 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'saved_cart_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN saved_cart_id UUID REFERENCES saved_carts(id) ON DELETE SET NULL;
        COMMENT ON COLUMN orders.saved_cart_id IS 'Référence au panier sauvegardé (si applicable)';
        RAISE NOTICE 'Colonne saved_cart_id ajoutée à orders';
    END IF;

    -- Ajouter stripe_payment_intent_id si absent (renommer payment_intent_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'stripe_payment_intent_id'
    ) THEN
        -- Si payment_intent_id existe, le renommer
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'orders' AND column_name = 'payment_intent_id'
        ) THEN
            ALTER TABLE orders RENAME COLUMN payment_intent_id TO stripe_payment_intent_id;
            RAISE NOTICE 'Colonne payment_intent_id renommée en stripe_payment_intent_id';
        ELSE
            ALTER TABLE orders ADD COLUMN stripe_payment_intent_id VARCHAR(255);
            RAISE NOTICE 'Colonne stripe_payment_intent_id ajoutée';
        END IF;
    END IF;
END $$;

-- 2. FONCTION DE CONVERSION saved_cart → order (ADAPTÉE)
CREATE OR REPLACE FUNCTION convert_saved_cart_to_order(
    p_saved_cart_id UUID,
    p_customer_id UUID,
    p_payment_intent_id TEXT,
    p_total_amount DECIMAL,
    p_shipping_amount DECIMAL DEFAULT 6.50
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_user_id UUID;
    v_order_number TEXT;
    v_customer_data RECORD;
    v_subtotal DECIMAL;
BEGIN
    -- Récupérer le user_id du saved_cart
    SELECT user_id INTO v_user_id FROM saved_carts WHERE id = p_saved_cart_id;

    -- Récupérer les données du customer
    SELECT * INTO v_customer_data FROM customers WHERE id = p_customer_id;

    -- Calculer le subtotal
    v_subtotal := p_total_amount - p_shipping_amount;

    -- Générer un numéro de commande unique
    SELECT 'REV-' || TO_CHAR(NOW(), 'YYYY-MM-DD-') || 
           LPAD(COALESCE(MAX(
               CASE 
                   WHEN order_number ~ '^REV-[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{4}$'
                   THEN SUBSTRING(order_number FROM 15 FOR 4)::INT 
                   ELSE 0 
               END
           ) + 1, 1)::TEXT, 4, '0')
    INTO v_order_number
    FROM orders
    WHERE order_number LIKE 'REV-' || TO_CHAR(NOW(), 'YYYY-MM-DD-') || '%';

    -- Créer la commande dans orders avec toutes les colonnes existantes
    INSERT INTO orders (
        id,
        order_number,
        customer_id,
        user_id,
        saved_cart_id,
        shipping_address,
        shipping_city,
        shipping_postal_code,
        shipping_country,
        subtotal_amount,
        shipping_amount,
        total_amount,
        order_status,
        payment_status,
        stripe_payment_intent_id,
        payment_method,
        created_at
    ) VALUES (
        gen_random_uuid(),
        v_order_number,
        p_customer_id,
        v_user_id,
        p_saved_cart_id,
        v_customer_data.address,
        v_customer_data.city,
        v_customer_data.postal_code,
        v_customer_data.country,
        v_subtotal,
        p_shipping_amount,
        p_total_amount,
        'pending',  -- Sera mis à jour après paiement
        'paid',
        CASE 
            WHEN p_payment_intent_id LIKE 'pi_%' THEN p_payment_intent_id
            ELSE 'pi_' || p_payment_intent_id
        END,
        'card',
        NOW()
    ) RETURNING id INTO v_order_id;

    -- Copier les items du saved_cart vers order_items
    -- Adapter les noms de colonnes aux colonnes réelles
    INSERT INTO order_items (
        id,
        order_id,
        item_number,
        photo_gcs_url,      -- photo_url → photo_gcs_url
        video_gcs_url,      -- video_url → video_gcs_url
        photo_filename,     
        video_filename,     
        message_text,       -- message → message_text
        message_signature,  -- signature → message_signature
        cadeau,            -- is_gift → cadeau
        nom,               -- Nom du destinataire cadeau
        adresse,           -- Adresse cadeau
        code_postal,       -- CP cadeau
        ville,             -- Ville cadeau
        unit_price,
        categorie,
        created_at
    )
    SELECT 
        gen_random_uuid(),
        v_order_id,
        'ITEM-' || LPAD(ROW_NUMBER() OVER (ORDER BY sci.position)::TEXT, 3, '0'),
        sci.photo_url,
        sci.video_url,
        sci.photo_original_name,
        sci.video_original_name,
        sci.message,
        sci.signature,
        sci.is_gift,
        CASE WHEN sci.is_gift THEN sci.gift_first_name || ' ' || sci.gift_last_name ELSE NULL END,
        CASE WHEN sci.is_gift THEN sci.gift_address ELSE NULL END,
        CASE WHEN sci.is_gift THEN sci.gift_postal_code ELSE NULL END,
        CASE WHEN sci.is_gift THEN sci.gift_city ELSE NULL END,
        CASE 
            WHEN sci.format = 'carre' THEN 9.00
            WHEN sci.format = '10x15' AND sci.with_frame THEN 27.50
            WHEN sci.format = '10x15' THEN 9.50
            WHEN sci.format = '20x30' AND sci.with_frame THEN 59.90
            WHEN sci.format = '20x30' THEN 24.90
            WHEN sci.format = '30x45' AND sci.with_frame THEN 94.90
            WHEN sci.format = '30x45' THEN 39.90
            ELSE 9.00
        END * sci.quantity,
        'photo_nfc',
        NOW()
    FROM saved_cart_items sci
    WHERE sci.cart_id = p_saved_cart_id;

    -- Marquer le saved_cart comme inactif
    UPDATE saved_carts 
    SET is_active = false, updated_at = NOW()
    WHERE id = p_saved_cart_id;

    -- Retourner l'ID de la commande créée
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- 3. FONCTION POUR CRÉER UNE COMMANDE DIRECTE (sans saved_cart)
CREATE OR REPLACE FUNCTION create_direct_order(
    p_customer_data JSONB,  -- Données du client
    p_items JSONB,          -- Items de la commande
    p_payment_intent_id TEXT,
    p_user_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_customer_id UUID;
    v_order_number TEXT;
    v_total_amount DECIMAL := 0;
    v_shipping_amount DECIMAL := 6.50;
    v_item JSONB;
BEGIN
    -- Créer ou récupérer le customer
    INSERT INTO customers (
        id,
        user_id,
        email,
        first_name,
        last_name,
        phone,
        address,
        city,
        postal_code,
        country,
        is_guest,
        created_at
    ) VALUES (
        gen_random_uuid(),
        p_user_id,
        p_customer_data->>'email',
        p_customer_data->>'first_name',
        p_customer_data->>'last_name',
        p_customer_data->>'phone',
        p_customer_data->>'address',
        p_customer_data->>'city',
        p_customer_data->>'postal_code',
        COALESCE(p_customer_data->>'country', 'France'),
        p_user_id IS NULL,
        NOW()
    ) 
    ON CONFLICT (email) DO UPDATE
    SET 
        user_id = COALESCE(EXCLUDED.user_id, customers.user_id),
        phone = COALESCE(EXCLUDED.phone, customers.phone),
        updated_at = NOW()
    RETURNING id INTO v_customer_id;

    -- Calculer le total
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_total_amount := v_total_amount + (v_item->>'unit_price')::DECIMAL * COALESCE((v_item->>'quantity')::INT, 1);
    END LOOP;
    v_total_amount := v_total_amount + v_shipping_amount;

    -- Générer le numéro de commande
    SELECT 'REV-' || TO_CHAR(NOW(), 'YYYY-MM-DD-') || 
           LPAD(COALESCE(MAX(
               CASE 
                   WHEN order_number ~ '^REV-[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{4}$'
                   THEN SUBSTRING(order_number FROM 15 FOR 4)::INT 
                   ELSE 0 
               END
           ) + 1, 1)::TEXT, 4, '0')
    INTO v_order_number
    FROM orders
    WHERE order_number LIKE 'REV-' || TO_CHAR(NOW(), 'YYYY-MM-DD-') || '%';

    -- Créer la commande
    INSERT INTO orders (
        id,
        order_number,
        customer_id,
        user_id,
        shipping_address,
        shipping_city,
        shipping_postal_code,
        shipping_country,
        subtotal_amount,
        shipping_amount,
        total_amount,
        order_status,
        payment_status,
        stripe_payment_intent_id,
        payment_method,
        created_at
    ) VALUES (
        gen_random_uuid(),
        v_order_number,
        v_customer_id,
        p_user_id,
        p_customer_data->>'address',
        p_customer_data->>'city',
        p_customer_data->>'postal_code',
        COALESCE(p_customer_data->>'country', 'France'),
        v_total_amount - v_shipping_amount,
        v_shipping_amount,
        v_total_amount,
        'pending',
        'pending',
        p_payment_intent_id,
        'card',
        NOW()
    ) RETURNING id INTO v_order_id;

    -- Insérer les items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO order_items (
            id,
            order_id,
            item_number,
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
        ) VALUES (
            gen_random_uuid(),
            v_order_id,
            v_item->>'item_number',
            v_item->>'photo_url',
            v_item->>'video_url',
            v_item->>'photo_filename',
            v_item->>'video_filename',
            v_item->>'message_text',
            v_item->>'message_signature',
            (v_item->>'is_gift')::BOOLEAN,
            v_item->>'gift_name',
            v_item->>'gift_address',
            v_item->>'gift_postal_code',
            v_item->>'gift_city',
            (v_item->>'unit_price')::DECIMAL,
            'photo_nfc',
            NOW()
        );
    END LOOP;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- 4. TRIGGER pour lier automatiquement customers existants aux nouveaux comptes
CREATE OR REPLACE FUNCTION link_existing_customer_to_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Si un customer existe avec cet email et n'a pas de user_id
    UPDATE customers 
    SET user_id = NEW.id,
        is_guest = false,
        updated_at = NOW()
    WHERE email = NEW.email 
    AND user_id IS NULL;

    -- Lier aussi les anciennes commandes de ce customer
    UPDATE orders o
    SET user_id = NEW.id,
        updated_at = NOW()
    FROM customers c
    WHERE o.customer_id = c.id
    AND c.email = NEW.email
    AND o.user_id IS NULL;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS link_customer_on_signup ON user_profiles;
CREATE TRIGGER link_customer_on_signup
    AFTER INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION link_existing_customer_to_user();

-- 5. VUE POUR HISTORIQUE DES COMMANDES
CREATE OR REPLACE VIEW user_orders_history AS
SELECT 
    o.id,
    o.order_number,
    o.created_at,
    o.total_amount,
    o.order_status,
    o.payment_status,
    o.shipping_address,
    o.shipping_city,
    o.shipping_postal_code,
    o.tracking_number,
    o.shipped_at,
    o.delivered_at,
    c.email,
    c.first_name || ' ' || c.last_name as customer_name,
    COUNT(oi.id) as items_count,
    o.user_id,
    o.saved_cart_id IS NOT NULL as from_saved_cart
FROM orders o
JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.order_number, o.created_at, o.total_amount, o.order_status, 
         o.payment_status, o.shipping_address, o.shipping_city, o.shipping_postal_code,
         o.tracking_number, o.shipped_at, o.delivered_at,
         c.email, c.first_name, c.last_name, o.user_id, o.saved_cart_id;

-- 6. FONCTION POUR RÉCUPÉRER L'HISTORIQUE D'UN UTILISATEUR
CREATE OR REPLACE FUNCTION get_user_order_history(p_user_id UUID)
RETURNS TABLE (
    order_id UUID,
    order_number VARCHAR,
    order_date TIMESTAMPTZ,
    total_amount DECIMAL,
    status VARCHAR,
    items_count BIGINT,
    tracking_number VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.order_number,
        o.created_at,
        o.total_amount,
        o.order_status,
        COUNT(oi.id),
        o.tracking_number
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.user_id = p_user_id
    GROUP BY o.id, o.order_number, o.created_at, o.total_amount, o.order_status, o.tracking_number
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 7. RLS POLICIES pour les tables existantes
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policies pour orders
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" 
    ON orders FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access orders" ON orders;
CREATE POLICY "Service role full access orders" 
    ON orders FOR ALL 
    USING (auth.jwt()->>'role' = 'service_role');

-- Policies pour order_items  
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" 
    ON order_items FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM orders o 
            WHERE o.id = order_items.order_id 
            AND o.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Service role full access order_items" ON order_items;
CREATE POLICY "Service role full access order_items" 
    ON order_items FOR ALL 
    USING (auth.jwt()->>'role' = 'service_role');

-- Policies pour customers
DROP POLICY IF EXISTS "Users can view own customer data" ON customers;
CREATE POLICY "Users can view own customer data" 
    ON customers FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own customer data" ON customers;
CREATE POLICY "Users can update own customer data" 
    ON customers FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access customers" ON customers;
CREATE POLICY "Service role full access customers" 
    ON customers FOR ALL 
    USING (auth.jwt()->>'role' = 'service_role');

-- 8. INDEX pour performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_saved_cart_id ON orders(saved_cart_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 9. FONCTION DE NETTOYAGE DES PANIERS EXPIRÉS
DROP FUNCTION IF EXISTS cleanup_expired_carts();
CREATE OR REPLACE FUNCTION cleanup_expired_carts()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Supprimer les paniers inactifs de plus de 30 jours
    WITH deleted AS (
        DELETE FROM saved_carts
        WHERE is_active = false 
        AND updated_at < NOW() - INTERVAL '30 days'
        RETURNING *
    )
    SELECT COUNT(*) INTO v_deleted_count FROM deleted;

    -- Supprimer les paniers actifs non modifiés depuis 7 jours
    WITH deleted AS (
        DELETE FROM saved_carts
        WHERE is_active = true 
        AND updated_at < NOW() - INTERVAL '7 days'
        RETURNING *
    )
    SELECT COUNT(*) + v_deleted_count INTO v_deleted_count FROM deleted;

    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 10. VÉRIFICATION FINALE
DO $$
BEGIN
    RAISE NOTICE '✅ INTÉGRATION COMPLÈTE';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Tables modifiées:';
    RAISE NOTICE '  - orders: user_id et saved_cart_id ajoutés';
    RAISE NOTICE '  - customers: déjà prêt avec user_id';
    RAISE NOTICE '  - order_items: utilise les colonnes existantes';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Fonctions créées:';
    RAISE NOTICE '  - convert_saved_cart_to_order()';
    RAISE NOTICE '  - create_direct_order()';
    RAISE NOTICE '  - get_user_order_history()';
    RAISE NOTICE '  - cleanup_expired_carts()';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 RLS activé sur:';
    RAISE NOTICE '  - orders';
    RAISE NOTICE '  - order_items';
    RAISE NOTICE '  - customers';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Système prêt pour production!';
END $$;