# 🔧 Conversion des Prix en Centimes pour Stripe

## 📋 Problème Identifié

Les prix dans la base de données sont stockés en **euros** (ex: 7.50, 9.50) alors que Stripe nécessite des **centimes** (ex: 750, 950).

Actuellement, le code multiplie par 100 au moment de créer le PaymentIntent Stripe, mais il serait plus cohérent de stocker directement en centimes dans la base de données.

## 🎯 Solution

### 1️⃣ D'abord, vérifier l'état actuel

Exécutez dans Supabase SQL Editor :
```sql
-- Copier le contenu de verify-prices.sql
```

### 2️⃣ Si les prix sont en euros (< 100), convertir en centimes

Exécutez dans Supabase SQL Editor :
```sql
-- Copier le contenu de fix-prices-to-centimes.sql
-- IMPORTANT: Remplacer la dernière ligne par COMMIT; si tout est OK
```

### 3️⃣ Mettre à jour le code TypeScript

Après conversion de la base de données, il faut adapter le code :

#### Option A : Garder les prix en euros dans pricing.ts (RECOMMANDÉ)
- **Avantage** : Plus lisible pour les humains
- **Modification** : Aucune, le code multiplie déjà par 100 pour Stripe
- **Base de données** : Stocker en centimes (après conversion SQL)

#### Option B : Convertir pricing.ts en centimes
- **Avantage** : Cohérence totale
- **Inconvénient** : Moins lisible (750 au lieu de 7.50)
- **Modification** : Multiplier tous les prix dans pricing.ts par 100

## 📊 Correspondance des Prix

| Format | Prix TTC (euros) | Prix TTC (centimes) |
|--------|------------------|---------------------|
| Carré  | 7.50 €          | 750 centimes        |
| 10x15  | 9.50 €          | 950 centimes        |
| 20x30  | 18.50 €         | 1850 centimes       |
| 30x45  | 24.50 €         | 2450 centimes       |

## ⚠️ Points d'Attention

1. **Faire une sauvegarde** avant d'exécuter les scripts SQL
2. **Vérifier** que les prix < 100 avant conversion (éviter double conversion)
3. **Tester** le paiement après conversion
4. **Surveiller** les nouvelles commandes pour s'assurer que les prix sont corrects

## 🔍 Vérification Finale

Après conversion, les prix dans `order_items` devraient être :
- Carré sans cadre : ~750 centimes
- 10x15 sans cadre : ~950 centimes  
- 20x30 sans cadre : ~1850 centimes
- 30x45 sans cadre : ~2450 centimes

(Plus élevés avec cadres, et peuvent varier avec les réductions)