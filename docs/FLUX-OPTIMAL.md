# 🎯 FLUX OPTIMAL - Système de Commande REVILA

## 📊 Architecture des Tables

### Tables Temporaires (Sauvegarde)
- `saved_carts` - Paniers en cours de création
- `saved_cart_items` - Items du panier en cours

### Tables de Production (Commandes Validées)
- `customers` - Informations clients (avec ou sans compte)
- `orders` - Commandes validées et payées
- `order_items` - Détails des items commandés
- `webhook_events` - Tracking des webhooks N8N

### Table d'Authentification
- `user_profiles` - Profils des utilisateurs connectés

## 🔄 Flux Optimal

### 1️⃣ **Phase de Création (Non connecté)**
```
Utilisateur arrive → /commander
↓
Sélection format → Upload photos/vidéos → Galerie
↓
SessionStorage (temporaire, sans compte)
```

### 2️⃣ **Phase de Sauvegarde (Optionnel)**
```
Popup après 1ère photo → "Créez un compte pour sauvegarder"
↓
Si OUI → Création compte → saved_carts + saved_cart_items
Si NON → Continue en guest → SessionStorage uniquement
```

### 3️⃣ **Phase de Validation**
```
Click "Payer" → Infos client → Paiement Stripe
↓
✅ Paiement réussi
↓
CRÉATION dans les tables PRODUCTION:
- customers (avec user_id si connecté, sinon is_guest = true)
- orders (avec user_id si connecté, saved_cart_id si applicable)
- order_items (tous les détails)
↓
Si saved_cart existe → Marquer comme inactive
↓
Webhook N8N déclenché
```

## 🔗 Liaisons Optimales

### Pour un utilisateur connecté:
```
user_profiles.id
    ↓
customers.user_id (liaison permanente)
    ↓
orders.user_id (traçabilité)
orders.saved_cart_id (si vient d'un panier sauvé)
    ↓
order_items.order_id
```

### Pour un invité:
```
customers.is_guest = true
customers.user_id = NULL
    ↓
orders.customer_id (liaison simple)
orders.user_id = NULL
    ↓
order_items.order_id
```

## 💾 Données à Stocker

### Dans `saved_carts` (temporaire):
- État du wizard
- Format et options
- Métadonnées temporaires

### Dans `saved_cart_items` (temporaire):
- URLs des fichiers uploadés
- Messages et personnalisations
- Quantités

### Dans `orders` (production):
```json
{
  "customer_id": "uuid",
  "user_id": "uuid ou null",
  "saved_cart_id": "uuid ou null",
  "order_number": "REV-2024-001",
  "status": "completed",
  "payment_status": "paid",
  "stripe_payment_intent_id": "pi_xxx",
  "total_amount": 99.90,
  "shipping_amount": 6.50,
  "metadata": {
    "source": "web",
    "with_account": true/false
  }
}
```

### Dans `order_items` (production):
```json
{
  "order_id": "uuid",
  "format": "10x15",
  "with_frame": true,
  "photo_url": "supabase_storage_url",
  "video_url": "supabase_storage_url",
  "message": "Texte personnalisé",
  "signature": "Jean",
  "quantity": 2,
  "unit_price": 27.50,
  "total_price": 55.00,
  "is_gift": true,
  "gift_recipient": {...}
}
```

## ✅ Avantages de ce Flux

1. **Séparation claire** : Temporaire vs Production
2. **Flexibilité** : Fonctionne avec ou sans compte
3. **Traçabilité** : Historique complet pour les utilisateurs connectés
4. **Performance** : Pas de duplication inutile
5. **Compatibilité** : Webhooks N8N continuent de fonctionner
6. **Évolutivité** : Facile d'ajouter des features (partage panier, etc.)

## 🚀 Implémentation

1. **Saved Cart → Order** : Fonction de conversion
2. **Auto-link** : Trigger pour lier automatiquement via email
3. **Cleanup** : Suppression auto des paniers expirés
4. **Recovery** : Email de récupération de panier abandonné