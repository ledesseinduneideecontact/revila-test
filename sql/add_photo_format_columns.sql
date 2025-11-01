-- Ajout des colonnes pour le format et le cadre dans order_items
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS format VARCHAR(10) DEFAULT '10x15',
ADD COLUMN IF NOT EXISTS with_frame BOOLEAN DEFAULT false;

-- Commentaires pour documenter les colonnes
COMMENT ON COLUMN order_items.format IS 'Format de la photo: 10x15, 20x30, ou 30x45';
COMMENT ON COLUMN order_items.with_frame IS 'Indique si la photo est avec cadre (true) ou sans cadre (false)';

-- Index pour faciliter les requêtes et statistiques
CREATE INDEX IF NOT EXISTS idx_order_items_format ON order_items(format);
CREATE INDEX IF NOT EXISTS idx_order_items_with_frame ON order_items(with_frame);