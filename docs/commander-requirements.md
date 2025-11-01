# 📋 Spécifications /commander - REVIVE Photos Magiques

## 🎯 Vue d'ensemble
La page `/commander` permet aux clients de créer une commande de photos magiques NFC personnalisées avec un processus en 8 étapes.

## 🔄 Architecture Wizard (8 étapes)

### Étape 1 : Choix du format
- **Formats disponibles** :
  - 10×15 cm (standard) - 15€
  - 20×30 cm (moyen) - 25€
  - 30×45 cm (grand) - 35€
- **Navigation** : Possibilité de retour arrière entre les étapes
- **État** : Sauvegarde en sessionStorage pour persistance

### Étape 2 : Upload photos/vidéos
- **Limites** :
  - Photos : 10 MB max (JPEG, PNG, WebP)
  - Vidéos : 50 MB max (MP4, WebM, QuickTime)
  - Pas de limite sur le nombre de photos
- **Fonctionnalités** :
  - Drag & drop
  - Upload multiple
  - Prévisualisation instantanée
  - **Recadrage photo** avec :
    - Rotation (-90° à +90°)
    - Zoom (1x à 3x)
    - Indicateur de qualité (low/medium/high) basé sur DPI

### Étape 3 : Gestion galerie
- Réorganisation des photos (drag & drop)
- Suppression individuelle
- Ajout de photos supplémentaires
- Vue grille responsive

### Étape 4 : Choix du cadre
- **Options** :
  - Sans cadre (inclus)
  - Avec cadre (+10€ par photo)
- Application par photo individuelle
- Prévisualisation du rendu

### Étape 5 : Messages personnalisés
- **Par photo** :
  - Message personnel (150 caractères max)
  - Signature optionnelle (50 caractères)
  - Suggestions de messages prédéfinis
  - **Option de suppression** du message
- Prévisualisation sur étiquette
- Modal d'édition avec aperçu temps réel

### Étape 6 : Options cadeau
- **Si cadeau** :
  - Prénom destinataire (requis)
  - Nom destinataire (requis)
  - Adresse complète (requis)
  - Code postal (requis)
  - Ville (requis)
- Validation des champs obligatoires
- Option "Ce n'est pas un cadeau"

### Étape 7 : Informations client
- **Champs obligatoires** :
  - Prénom
  - Nom
  - Email (validation format)
  - Téléphone
  - Adresse
  - Code postal
  - Ville
- Sauvegarde automatique en sessionStorage
- Validation temps réel

### Étape 8 : Récapitulatif & Paiement
- **Affichage** :
  - Résumé visuel de toutes les photos
  - Détails par photo (format, cadre, message)
  - Calcul du prix total
  - Informations de livraison
- **Paiement** :
  - Intégration Stripe
  - PaymentIntent créé côté serveur
  - Redirection vers `/confirmation` après succès

## 💾 Structure de données

### PhotoItem Interface
```typescript
interface PhotoItem {
  id: string
  photoFile?: File
  videoFile?: File
  photoPreview?: string
  videoPreview?: string
  format: '10x15' | '20x30' | '30x45'
  withFrame: boolean
  message: string
  signature: string
  isGift: boolean
  giftFirstName?: string
  giftLastName?: string
  giftAddress?: string
  giftPostalCode?: string
  giftCity?: string
}
```

### Prix
```typescript
const PRICES = {
  formats: {
    '10x15': 15,
    '20x30': 25,
    '30x45': 35
  },
  frame: 10
}
```

## 🔒 Gestion des erreurs

### Null checks requis
- Tous les accès aux propriétés d'objets photo doivent utiliser l'opérateur `?.`
- Vérifier `!photo` avant d'accéder aux propriétés dans les modals
- Exemples corrigés :
  - `photo?.message || ''`
  - `photo?.giftFirstName || ''`

### Validation fichiers
- Vérification du type MIME réel (pas juste l'extension)
- Limite de taille avant upload
- Messages d'erreur explicites

## 🎨 UI/UX

### Navigation
- Boutons "Précédent" et "Suivant" persistants
- Indicateur de progression (steps 1-8)
- Sauvegarde automatique à chaque changement
- Possibilité de revenir en arrière sans perdre les données

### Responsive
- Grille adaptative (2 colonnes mobile, 3-4 desktop)
- Modals plein écran sur mobile
- Touch-friendly pour drag & drop

### États visuels
- Loading states pendant les uploads
- Indicateurs de succès/erreur
- Badges pour photos avec message
- Aperçus temps réel

## 🔄 Flux de données

1. **SessionStorage** : Sauvegarde continue de l'état
2. **FormData** : Upload direct des fichiers (pas de sérialisation JSON)
3. **Supabase** : Stockage des fichiers et métadonnées
4. **Stripe** : Gestion du paiement
5. **Webhook N8N** : Notification après paiement réussi

## ⚠️ Points d'attention

### Performance
- Lazy loading des prévisualisations
- Cleanup des blob URLs après usage
- Compression des images côté client si > 5MB

### Sécurité
- Validation côté serveur de tous les inputs
- Sanitization des messages personnalisés
- Vérification des types MIME réels

### Accessibilité
- Labels ARIA pour drag & drop
- Navigation clavier complète
- Messages d'erreur explicites

## 🐛 Bugs connus résolus
- ✅ TypeError sur `photo.message` → Ajout null checks
- ✅ TypeError sur `photo.giftFirstName` → Ajout null checks  
- ✅ Erreur syntaxe StepUpload → Accolade manquante corrigée

## 📝 TODO / Améliorations futures
- [ ] Sauvegarde brouillon côté serveur
- [ ] Templates de messages par occasion
- [ ] Preview 3D du rendu final
- [ ] Multi-langue (FR/EN)
- [ ] Codes promo dynamiques
- [ ] Tracking analytics par étape

## 🔗 Fichiers clés
- `/app/commander/page.tsx` - Page principale
- `/app/commander/CommanderWizard.tsx` - Logique wizard
- `/app/commander/steps/*.tsx` - Composants par étape
- `/components/PhotoCropperAdvanced.tsx` - Outil de recadrage
- `/app/api/orders/create-with-payment/route.ts` - API création commande

---
*Dernière mise à jour : Janvier 2025*