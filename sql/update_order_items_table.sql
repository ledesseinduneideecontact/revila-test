-- Script pour modifier la table order_items
-- Supprime gift_address et ajoute les nouvelles colonnes

-- 1. Ajouter les nouvelles colonnes
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS cadeau BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS nom VARCHAR(255),
ADD COLUMN IF NOT EXISTS adresse VARCHAR(500),
ADD COLUMN IF NOT EXISTS code_postal VARCHAR(10),
ADD COLUMN IF NOT EXISTS ville VARCHAR(255);

-- 2. Migrer les données existantes de gift_address vers les nouvelles colonnes
-- (si gift_address contient des données, on met cadeau à true)
UPDATE order_items 
SET cadeau = true 
WHERE gift_address IS NOT NULL AND gift_address != '';

-- Note: Les données d'adresse existantes dans gift_address seront perdues
-- Il faudra les migrer manuellement si nécessaire

-- 3. Supprimer l'ancienne colonne gift_address
ALTER TABLE order_items 
DROP COLUMN IF EXISTS gift_address;

-- 4. Ajouter des commentaires pour clarifier l'utilisation
COMMENT ON COLUMN order_items.cadeau IS 'Indique si l''article est envoyé comme cadeau';
COMMENT ON COLUMN order_items.nom IS 'Nom du destinataire (client ou bénéficiaire du cadeau)';
COMMENT ON COLUMN order_items.adresse IS 'Adresse de livraison';
COMMENT ON COLUMN order_items.code_postal IS 'Code postal de livraison';
COMMENT ON COLUMN order_items.ville IS 'Ville de livraison';