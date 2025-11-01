-- =====================================================
-- Script pour corriger le trigger qui référence
-- des colonnes inexistantes
-- =====================================================

-- Option 1: Supprimer le trigger problématique
DROP TRIGGER IF EXISTS recalculate_order_totals_trigger ON order_items;
DROP FUNCTION IF EXISTS recalculate_order_totals();

-- Option 2: Si vous voulez recréer un trigger fonctionnel
-- (décommenter si nécessaire)
/*
CREATE OR REPLACE FUNCTION recalculate_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculer les totaux de la commande
    UPDATE orders
    SET 
        subtotal_amount = (
            SELECT COALESCE(SUM(unit_price), 0)
            FROM order_items
            WHERE order_id = NEW.order_id
        ),
        total_amount = subtotal_amount + shipping_cost - discount_amount
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_order_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION recalculate_order_totals();
*/