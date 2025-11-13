#!/bin/bash

# ==============================================================================
# SCRIPT DE DÉPLOIEMENT AUTOMATISÉ - REVILA PRODUCTION
# ==============================================================================
# Ce script automatise le déploiement de l'application Revila sur VPS
# avec Docker Compose.
#
# UTILISATION :
#   ./deploy.sh                    # Déploiement standard
#   ./deploy.sh --skip-backup      # Déploiement sans backup
#   ./deploy.sh --force-rebuild    # Force la reconstruction complète
#   ./deploy.sh --help             # Afficher l'aide
#
# PRÉREQUIS :
#   - Docker et Docker Compose installés
#   - Git configuré
#   - Fichier .env.production présent
#   - Permissions d'exécution : chmod +x deploy.sh
# ==============================================================================

set -e  # Arrêter en cas d'erreur

# ------------------------------------------------------------------------------
# VARIABLES DE CONFIGURATION
# ------------------------------------------------------------------------------
APP_DIR="$HOME/revila-test"
COMPOSE_FILE="docker-compose.production.yml"
BACKUP_DIR="$APP_DIR/backups"
LOG_FILE="$APP_DIR/logs/deploy-$(date +%Y%m%d-%H%M%S).log"
HEALTH_CHECK_URL="http://localhost:3000/api/health"
MAX_HEALTH_RETRIES=30
HEALTH_RETRY_DELAY=2

# Options de déploiement
SKIP_BACKUP=false
FORCE_REBUILD=false

# ------------------------------------------------------------------------------
# COULEURS POUR L'AFFICHAGE
# ------------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ------------------------------------------------------------------------------
# FONCTIONS UTILITAIRES
# ------------------------------------------------------------------------------

# Afficher un message d'information
info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Afficher un message de succès
success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Afficher un avertissement
warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Afficher une erreur et quitter
error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

# Afficher une étape
step() {
    echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}▶ $1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Afficher l'aide
show_help() {
    cat << EOF
${CYAN}SCRIPT DE DÉPLOIEMENT REVILA${NC}

${YELLOW}UTILISATION:${NC}
    ./deploy.sh [OPTIONS]

${YELLOW}OPTIONS:${NC}
    --skip-backup        Sauter l'étape de backup de la base de données
    --force-rebuild      Forcer la reconstruction complète des images Docker
    --help              Afficher cette aide

${YELLOW}EXEMPLES:${NC}
    ./deploy.sh                     Déploiement standard avec backup
    ./deploy.sh --skip-backup       Déploiement rapide sans backup
    ./deploy.sh --force-rebuild     Reconstruction complète

${YELLOW}PRÉREQUIS:${NC}
    - Docker et Docker Compose installés
    - Git configuré avec accès au repository
    - Fichier .env.production configuré
    - Permissions d'exécution (chmod +x deploy.sh)

${YELLOW}LOGS:${NC}
    Les logs de déploiement sont sauvegardés dans : $APP_DIR/logs/

EOF
    exit 0
}

# ------------------------------------------------------------------------------
# PARSING DES ARGUMENTS
# ------------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --force-rebuild)
            FORCE_REBUILD=true
            shift
            ;;
        --help)
            show_help
            ;;
        *)
            error "Option inconnue: $1\nUtilisez --help pour voir les options disponibles"
            ;;
    esac
done

# ------------------------------------------------------------------------------
# DÉBUT DU DÉPLOIEMENT
# ------------------------------------------------------------------------------

echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██████╗ ███████╗██╗   ██╗██╗██╗      █████╗               ║
║   ██╔══██╗██╔════╝██║   ██║██║██║     ██╔══██╗              ║
║   ██████╔╝█████╗  ██║   ██║██║██║     ███████║              ║
║   ██╔══██╗██╔══╝  ╚██╗ ██╔╝██║██║     ██╔══██║              ║
║   ██║  ██║███████╗ ╚████╔╝ ██║███████╗██║  ██║              ║
║   ╚═╝  ╚═╝╚══════╝  ╚═══╝  ╚═╝╚══════╝╚═╝  ╚═╝              ║
║                                                               ║
║           DÉPLOIEMENT AUTOMATISÉ - PRODUCTION                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

info "Démarrage du déploiement le $(date '+%Y-%m-%d à %H:%M:%S')"
info "Répertoire de travail : $APP_DIR"

# Créer le dossier de logs s'il n'existe pas
mkdir -p "$(dirname "$LOG_FILE")"

# ------------------------------------------------------------------------------
# ÉTAPE 1 : VÉRIFICATIONS PRÉLIMINAIRES
# ------------------------------------------------------------------------------
step "ÉTAPE 1/8 : Vérifications préliminaires"

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    error "Docker n'est pas installé. Installez-le d'abord."
fi
success "Docker est installé : $(docker --version)"

# Vérifier que Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose n'est pas installé. Installez-le d'abord."
fi
success "Docker Compose est installé : $(docker-compose --version)"

# Vérifier que Git est installé
if ! command -v git &> /dev/null; then
    error "Git n'est pas installé. Installez-le d'abord."
fi
success "Git est installé : $(git --version)"

# Vérifier que le répertoire de l'application existe
if [ ! -d "$APP_DIR" ]; then
    error "Le répertoire $APP_DIR n'existe pas."
fi
success "Répertoire de l'application trouvé"

# Se déplacer dans le répertoire de l'application
cd "$APP_DIR" || error "Impossible d'accéder à $APP_DIR"

# Vérifier que le fichier .env.production existe
if [ ! -f ".env.production" ]; then
    error "Le fichier .env.production est manquant. Créez-le d'abord."
fi
success "Fichier .env.production trouvé"

# Vérifier que docker-compose.production.yml existe
if [ ! -f "$COMPOSE_FILE" ]; then
    error "Le fichier $COMPOSE_FILE est manquant."
fi
success "Fichier $COMPOSE_FILE trouvé"

# ------------------------------------------------------------------------------
# ÉTAPE 2 : BACKUP DE LA BASE DE DONNÉES
# ------------------------------------------------------------------------------
if [ "$SKIP_BACKUP" = false ]; then
    step "ÉTAPE 2/8 : Backup de la base de données"

    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/db-backup-$(date +%Y%m%d-%H%M%S).sql"

    info "Création du backup : $BACKUP_FILE"

    # Récupérer les variables d'environnement
    source .env.production

    # Créer le backup
    if docker exec revila-db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_FILE" 2>> "$LOG_FILE"; then
        success "Backup créé avec succès : $(du -h "$BACKUP_FILE" | cut -f1)"

        # Compresser le backup
        gzip "$BACKUP_FILE"
        success "Backup compressé : $BACKUP_FILE.gz"

        # Garder seulement les 7 derniers backups
        info "Nettoyage des anciens backups (conservation des 7 derniers)..."
        cd "$BACKUP_DIR"
        ls -t db-backup-*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm --
        cd "$APP_DIR"
        success "Nettoyage des backups terminé"
    else
        warning "Le backup a échoué (peut-être que la base n'est pas encore créée)"
    fi
else
    step "ÉTAPE 2/8 : Backup ignoré (--skip-backup)"
fi

# ------------------------------------------------------------------------------
# ÉTAPE 3 : RÉCUPÉRATION DES DERNIÈRES MODIFICATIONS
# ------------------------------------------------------------------------------
step "ÉTAPE 3/8 : Récupération des dernières modifications depuis GitHub"

# Afficher la branche actuelle
CURRENT_BRANCH=$(git branch --show-current)
info "Branche actuelle : $CURRENT_BRANCH"

# Récupérer les dernières modifications
info "Récupération des modifications..."
if git pull origin "$CURRENT_BRANCH" 2>&1 | tee -a "$LOG_FILE"; then
    success "Code mis à jour depuis GitHub"
else
    error "Échec de la récupération du code"
fi

# Afficher le dernier commit
LAST_COMMIT=$(git log -1 --pretty=format:"%h - %s (%an, %ar)")
info "Dernier commit : $LAST_COMMIT"

# ------------------------------------------------------------------------------
# ÉTAPE 4 : ARRÊT DES CONTENEURS
# ------------------------------------------------------------------------------
step "ÉTAPE 4/8 : Arrêt des conteneurs en cours"

info "Arrêt des conteneurs..."
if docker-compose -f "$COMPOSE_FILE" down 2>&1 | tee -a "$LOG_FILE"; then
    success "Conteneurs arrêtés avec succès"
else
    warning "Aucun conteneur à arrêter ou erreur lors de l'arrêt"
fi

# ------------------------------------------------------------------------------
# ÉTAPE 5 : CONSTRUCTION DES IMAGES
# ------------------------------------------------------------------------------
step "ÉTAPE 5/8 : Construction des images Docker"

if [ "$FORCE_REBUILD" = true ]; then
    info "Reconstruction complète forcée (--force-rebuild)..."
    BUILD_ARGS="--no-cache --pull"
else
    info "Construction des images..."
    BUILD_ARGS=""
fi

if docker-compose -f "$COMPOSE_FILE" build $BUILD_ARGS 2>&1 | tee -a "$LOG_FILE"; then
    success "Images construites avec succès"
else
    error "Échec de la construction des images"
fi

# ------------------------------------------------------------------------------
# ÉTAPE 6 : DÉMARRAGE DES CONTENEURS
# ------------------------------------------------------------------------------
step "ÉTAPE 6/8 : Démarrage des conteneurs"

info "Démarrage des conteneurs en arrière-plan..."
if docker-compose -f "$COMPOSE_FILE" up -d 2>&1 | tee -a "$LOG_FILE"; then
    success "Conteneurs démarrés avec succès"
else
    error "Échec du démarrage des conteneurs"
fi

# Afficher l'état des conteneurs
info "État des conteneurs :"
docker-compose -f "$COMPOSE_FILE" ps | tee -a "$LOG_FILE"

# ------------------------------------------------------------------------------
# ÉTAPE 7 : VÉRIFICATION DE LA SANTÉ DE L'APPLICATION
# ------------------------------------------------------------------------------
step "ÉTAPE 7/8 : Vérification de la santé de l'application"

info "Attente du démarrage de l'application..."
sleep 5

RETRY_COUNT=0
HEALTH_OK=false

while [ $RETRY_COUNT -lt $MAX_HEALTH_RETRIES ]; do
    info "Vérification de santé ($((RETRY_COUNT + 1))/$MAX_HEALTH_RETRIES)..."

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL" 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        success "Application en bonne santé ! (HTTP $HTTP_CODE)"
        HEALTH_OK=true
        break
    else
        warning "Application pas encore prête (HTTP $HTTP_CODE). Nouvelle tentative dans ${HEALTH_RETRY_DELAY}s..."
        sleep $HEALTH_RETRY_DELAY
        RETRY_COUNT=$((RETRY_COUNT + 1))
    fi
done

if [ "$HEALTH_OK" = false ]; then
    error "L'application ne répond pas après $MAX_HEALTH_RETRIES tentatives. Consultez les logs : docker-compose -f $COMPOSE_FILE logs"
fi

# ------------------------------------------------------------------------------
# ÉTAPE 8 : NETTOYAGE
# ------------------------------------------------------------------------------
step "ÉTAPE 8/8 : Nettoyage des anciennes images"

info "Suppression des images Docker non utilisées..."
docker image prune -f 2>&1 | tee -a "$LOG_FILE"
success "Nettoyage terminé"

# ------------------------------------------------------------------------------
# RÉSUMÉ DU DÉPLOIEMENT
# ------------------------------------------------------------------------------

echo -e "\n${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║              ✓ DÉPLOIEMENT RÉUSSI !                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

success "Déploiement terminé avec succès le $(date '+%Y-%m-%d à %H:%M:%S')"

echo -e "\n${CYAN}📊 INFORMATIONS UTILES${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}Logs du déploiement :${NC}      $LOG_FILE"
echo -e "${YELLOW}Dernier commit :${NC}           $LAST_COMMIT"
echo -e "${YELLOW}URL de santé :${NC}             $HEALTH_CHECK_URL"
echo -e ""
echo -e "${CYAN}🔧 COMMANDES UTILES${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}Voir les logs en temps réel :${NC}"
echo -e "  docker-compose -f $COMPOSE_FILE logs -f"
echo -e ""
echo -e "${YELLOW}Voir l'état des conteneurs :${NC}"
echo -e "  docker-compose -f $COMPOSE_FILE ps"
echo -e ""
echo -e "${YELLOW}Redémarrer l'application :${NC}"
echo -e "  docker-compose -f $COMPOSE_FILE restart"
echo -e ""
echo -e "${YELLOW}Arrêter l'application :${NC}"
echo -e "  docker-compose -f $COMPOSE_FILE down"
echo -e ""

exit 0
