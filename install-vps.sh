#!/bin/bash

# ==============================================================================
# SCRIPT D'INSTALLATION COMPLÈTE - REVILA VPS
# ==============================================================================
# Ce script installe tout ce qui est nécessaire pour déployer Revila
# ==============================================================================

set -e  # Arrêter en cas d'erreur

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo -e "${PURPLE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║         INSTALLATION REVILA - VPS HOSTINGER                   ║${NC}"
echo -e "${PURPLE}╚═══════════════════════════════════════════════════════════════╝${NC}"

# ==============================================================================
# ÉTAPE 1 : MISE À JOUR DU SYSTÈME
# ==============================================================================
info "Étape 1/6 : Mise à jour du système..."
apt update && apt upgrade -y
success "Système mis à jour"

# ==============================================================================
# ÉTAPE 2 : INSTALLATION DES DÉPENDANCES
# ==============================================================================
info "Étape 2/6 : Installation des dépendances..."
apt install -y ca-certificates curl gnupg lsb-release git ufw fail2ban
success "Dépendances installées"

# ==============================================================================
# ÉTAPE 3 : INSTALLATION DE DOCKER
# ==============================================================================
info "Étape 3/6 : Installation de Docker..."

# Vérifier si Docker est déjà installé
if command -v docker &> /dev/null; then
    warning "Docker est déjà installé : $(docker --version)"
else
    # Créer le répertoire pour les clés
    install -m 0755 -d /etc/apt/keyrings

    # Ajouter la clé GPG Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Ajouter le repository Docker
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Installer Docker
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    success "Docker installé : $(docker --version)"
fi

# Vérifier Docker Compose
if docker compose version &> /dev/null; then
    success "Docker Compose installé : $(docker compose version)"
else
    error "Docker Compose n'est pas installé correctement"
fi

# ==============================================================================
# ÉTAPE 4 : INSTALLATION DE NGINX
# ==============================================================================
info "Étape 4/6 : Installation de Nginx..."

if command -v nginx &> /dev/null; then
    warning "Nginx est déjà installé : $(nginx -v 2>&1)"
else
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
    success "Nginx installé et démarré"
fi

# ==============================================================================
# ÉTAPE 5 : CONFIGURATION DU FIREWALL (BASIQUE)
# ==============================================================================
info "Étape 5/6 : Configuration du firewall..."

# Autoriser SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Activer le firewall (avec confirmation automatique)
echo "y" | ufw enable

success "Firewall configuré (SSH, HTTP, HTTPS autorisés)"

# ==============================================================================
# ÉTAPE 6 : CLONAGE DU REPOSITORY
# ==============================================================================
info "Étape 6/6 : Clonage du repository GitHub..."

cd ~

if [ -d "revila-test" ]; then
    warning "Le répertoire revila-test existe déjà, on le supprime..."
    rm -rf revila-test
fi

git clone https://github.com/ledesseinduneideecontact/revila-test.git
cd revila-test

success "Repository cloné dans ~/revila-test"

# ==============================================================================
# RÉSUMÉ
# ==============================================================================
echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✓ INSTALLATION TERMINÉE !                        ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${YELLOW}📊 VERSIONS INSTALLÉES :${NC}"
echo -e "  Docker        : $(docker --version)"
echo -e "  Docker Compose: $(docker compose version)"
echo -e "  Nginx         : $(nginx -v 2>&1)"
echo -e "  Git           : $(git --version)"

echo -e "\n${YELLOW}📁 RÉPERTOIRE DE L'APPLICATION :${NC}"
echo -e "  ~/revila-test"

echo -e "\n${YELLOW}🔥 FIREWALL :${NC}"
ufw status numbered

echo -e "\n${YELLOW}➡️  PROCHAINES ÉTAPES :${NC}"
echo -e "  1. Configurer le fichier .env.production"
echo -e "  2. Déployer l'application avec Docker Compose"
echo -e "  3. Configurer Nginx et SSL"

echo -e "\n${GREEN}Vous pouvez maintenant passer à la configuration !${NC}\n"
