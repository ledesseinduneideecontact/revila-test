#!/bin/bash

# Script de build Docker pour Revive App
# Usage: ./build-docker.sh

echo "🐳 Building Revive App Docker Image..."

# Variables d'environnement (à adapter selon votre configuration)
export NEXT_PUBLIC_SUPABASE_URL="https://zpczpnfrzvrivacifacu.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwY3pwbmZyenZyaXZhY2lmYWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNjk2NTIsImV4cCI6MjA2Njg0NTY1Mn0.EAkdDd4OJpgyrZYH5Pz7XiHcEMsHx5u0AM8FQuZdZlk"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwY3pwbmZyenZyaXZhY2lmYWN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTI2OTY1MiwiZXhwIjoyMDY2ODQ1NjUyfQ.-Zo4x2o4I6DKyCZ2Tw2Ici3KWYK4WvXVz8FevQDewhw"
export STRIPE_SECRET_KEY="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"
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_51RmHywJUSulGi8fbGMtdHfbQQrAtj7AE0qroen2L2XJUAr0sr3im7tTpvLOUJejh4q6Fe0t413PLDQmZdJhS3gAt00QJ2AqWhe"
export N8N_WEBHOOK_NEW_ORDER_PROD="https://primary-production-be41.up.railway.app/webhook/4b18ffa4-6a37-4694-b45f-7fec78b22092"
export N8N_WEBHOOK_NEW_ORDER_TEST="https://primary-production-be41.up.railway.app/webhook-test/4b18ffa4-6a37-4694-b45f-7fec78b22092"

# Build l'image Docker
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --build-arg STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" \
  --build-arg N8N_WEBHOOK_NEW_ORDER_PROD="$N8N_WEBHOOK_NEW_ORDER_PROD" \
  --build-arg N8N_WEBHOOK_NEW_ORDER_TEST="$N8N_WEBHOOK_NEW_ORDER_TEST" \
  -t revive-app:latest .

echo "✅ Build terminé !"
echo "🚀 Pour lancer le conteneur :"
echo "docker run -d --name revive-app-container -p 3000:3000 revive-app:latest" 