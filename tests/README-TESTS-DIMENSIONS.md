# Tests du Fix des Dimensions Impaires FFmpeg

## 🎯 Objectif

Valider que le fix empêche l'erreur FFmpeg `height not divisible by 2` avec les vidéos aux dimensions impaires.

## ✅ Statut: VALIDÉ

Tous les tests sont réussis. Le fix fonctionne correctement.

## 🚀 Lancer les Tests

### Test Rapide (3-5 secondes)
```bash
npx tsx tests/test-odd-dimensions.js
```

### Test Complet avec Montage (20-30 secondes)
```bash
npx tsx tests/test-integration-odd-dimensions.js
```

## 📊 Résultats Attendus

**Test 1**: Optimisation vidéo 2106x1780
```
Entrée:  2106x1780
Sortie:  1920x1622 ✅
Status:  TOUS LES TESTS RÉUSSIS!
```

**Test 2**: Montage complet
```
Vidéo:   2106x1780 → Montage 1080x1920
Status:  TEST D'INTÉGRATION RÉUSSI!
```

## 🔧 Le Fix

**Fichier**: `lib/ffmpeg-processor.ts` ligne 133

**Avant**:
```typescript
.videoFilters(`scale='min(1920,iw)':'-2':force_original_aspect_ratio=decrease`)
```

**Après**:
```typescript
.videoFilters(`scale=min(1920\\,iw):-2`)
```

## 📁 Fichiers de Test

- `test-odd-dimensions.js` - Test unitaire
- `test-integration-odd-dimensions.js` - Test d'intégration
- `fixtures/odd-dimensions/video-odd-2106x1780.mp4` - Vidéo de test

## 📖 Documentation Complète

- `VALIDATION-COMPLETE.md` - Rapport détaillé
- `RAPPORT-TEST-ODD-DIMENSIONS.md` - Analyse technique
- `RESULTAT-TEST-DIMENSIONS.txt` - Résumé visuel

## 🎬 Test Manuel avec FFmpeg

```bash
# Optimiser la vidéo de test
ffmpeg -i tests/fixtures/odd-dimensions/video-odd-2106x1780.mp4 \
  -vf "scale=min(1920\,iw):-2" \
  -preset veryfast -crf 23 -pix_fmt yuv420p \
  tmp/test-manual.mp4

# Vérifier les dimensions
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height \
  -of csv=p=0 tmp/test-manual.mp4
```

**Résultat attendu**: `1920,1622` (dimensions paires)

## ✅ Checklist de Validation

- [x] Fix appliqué dans le code source
- [x] Test unitaire réussi
- [x] Test d'intégration réussi
- [x] Dimensions de sortie toujours paires
- [x] Ratio d'aspect préservé
- [x] Aucune erreur FFmpeg
- [x] Documentation complète

## 🏁 Conclusion

Le fix est **validé et prêt pour la production**.
