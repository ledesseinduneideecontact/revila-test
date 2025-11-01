-- Ajouter la colonne quantity à la table order_items
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1 CHECK (quantity > 0);

-- Mettre à jour les lignes existantes pour avoir quantity = 1
UPDATE order_items 
SET quantity = 1 
WHERE quantity IS NULL;

-- Ajouter un commentaire pour expliquer l'utilisation
COMMENT ON COLUMN order_items.quantity IS 'Quantité de l\'article commandé (utile pour les cadres vendus en lot)';