-- Script pour nettoyer toutes les données de test
-- ATTENTION : Ce script supprime TOUTES les données des tables et des buckets Storage

-- ================================================
-- 1. SUPPRIMER TOUS LES FICHIERS DES BUCKETS
-- ================================================
-- Note: Cette partie doit être exécutée via l'interface Supabase Storage
-- ou via l'API Storage, car SQL ne peut pas directement supprimer les fichiers

-- Pour supprimer via l'interface Supabase :
-- 1. Aller dans Storage > photos > Sélectionner tous les fichiers > Supprimer
-- 2. Aller dans Storage > videos > Sélectionner tous les fichiers > Supprimer

-- Ou utiliser cette fonction (si vous avez les permissions) :
-- SELECT storage.delete_all_objects('photos');
-- SELECT storage.delete_all_objects('videos');

-- ================================================
-- 2. SUPPRIMER TOUTES LES DONNÉES DES TABLES
-- ================================================
-- L'ordre est important à cause des contraintes de clés étrangères

-- Désactiver temporairement les contraintes pour faciliter la suppression
SET session_replication_role = 'replica';

-- Supprimer les événements webhook (si la table existe)
TRUNCATE TABLE webhook_events CASCADE;

-- Supprimer les items de commande
TRUNCATE TABLE order_items CASCADE;

-- Supprimer les commandes
TRUNCATE TABLE orders CASCADE;

-- Supprimer les clients
TRUNCATE TABLE customers CASCADE;

-- Réactiver les contraintes
SET session_replication_role = 'origin';

-- ================================================
-- 3. RÉINITIALISER LES SÉQUENCES (optionnel)
-- ================================================
-- Si vous voulez que les IDs auto-générés recommencent à 1

-- Pour la table customers (si elle a une séquence)
ALTER SEQUENCE IF EXISTS customers_id_seq RESTART WITH 1;

-- Pour la table orders (si elle a une séquence)
ALTER SEQUENCE IF EXISTS orders_id_seq RESTART WITH 1;

-- Pour la table order_items (si elle a une séquence)
ALTER SEQUENCE IF EXISTS order_items_id_seq RESTART WITH 1;

-- Pour la table webhook_events (si elle a une séquence)
ALTER SEQUENCE IF EXISTS webhook_events_id_seq RESTART WITH 1;

-- ================================================
-- 4. VÉRIFICATION
-- ================================================
-- Vérifier que toutes les tables sont vides
SELECT 'customers' as table_name, COUNT(*) as row_count FROM customers
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'webhook_events', COUNT(*) FROM webhook_events;

-- ================================================
-- NOTES IMPORTANTES
-- ================================================
-- 1. Ce script supprime TOUTES les données, pas seulement les tests
-- 2. Les fichiers dans Storage doivent être supprimés manuellement
-- 3. Faites une sauvegarde avant si vous avez des données importantes
-- 4. Après suppression, les tables conservent leur structure