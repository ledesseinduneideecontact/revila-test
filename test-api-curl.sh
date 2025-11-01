#!/bin/bash

echo "🧪 Test de création de commande avec curl..."
echo ""

# Créer des fichiers de test temporaires
echo "Création des fichiers de test..."

# Créer une image PNG minimale (1x1 pixel)
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDAT\x08\x99c\xf8\xcf\xc0\x00\x00\x00\x03\x00\x01\x9e\xb3a\x8c\x00\x00\x00\x00IEND\xaeB`\x82' > test-photo.png

# Créer une vidéo MP4 minimale
printf '\x00\x00\x00\x20ftypiso\x00\x00\x02\x00isomiso2avc1mp41\x00\x00\x00\x08free\x00\x00\x00\x00\x00\x00\x00\x00mdat' > test-video.mp4

# Données client
CUSTOMER_INFO='{"firstName":"Test","lastName":"Client","email":"test@example.com","phone":"0612345678","address":"123 Rue du Test","postalCode":"75001","city":"Paris","country":"France"}'

# Envoyer la requête
echo "Envoi de la requête à l'API..."
curl -X POST http://localhost:3002/api/orders/create-with-payment \
  -F "customerInfo=$CUSTOMER_INFO" \
  -F "total=10.49" \
  -F "items[0][photo]=@test-photo.png;type=image/png" \
  -F "items[0][video]=@test-video.mp4;type=video/mp4" \
  -F "items[0][message]=Message de test" \
  -F "items[0][signature]=Signature test" \
  -F "items[0][photoSize]=10x15" \
  -F "items[0][withFrame]=false" \
  -w "\n\nHTTP Status: %{http_code}\n"

# Nettoyer les fichiers de test
rm -f test-photo.png test-video.mp4

echo ""
echo "✅ Test terminé"