#!/bin/bash

# Aelus Aether MCP - Quick Deployment Script
# Usage: ./deploy.sh [start|stop|restart|logs|status|update]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Print colored message
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        log_warning ".env file not found. Creating from .env.docker.example..."
        cp .env.docker.example .env
        log_warning "Please edit .env file and set your configuration:"
        log_warning "  1. VOYAGE_API_KEY - Get from https://www.voyageai.com/"
        log_warning "  2. REPOS_PATH - Path to your code repositories"
        log_warning "  3. CORS_ORIGINS - Your n8n URL"
        echo ""
        log_error "Please configure .env file before deploying."
        exit 1
    fi
}

# Start services
start_services() {
    log_info "Starting Aelus Aether MCP services..."

    check_docker
    check_env

    # Build if images don't exist
    if [ ! "$(docker images -q aelus-aether-mcp_aelus-mcp 2> /dev/null)" ]; then
        log_info "Building Docker image (first time setup)..."
        docker-compose build
    fi

    # Start services
    docker-compose up -d

    log_success "Services started successfully!"
    echo ""
    log_info "Waiting for health check..."
    sleep 5

    # Check health
    if curl -f http://localhost:3000/health &> /dev/null; then
        log_success "API is healthy!"
        echo ""
        log_info "Access points:"
        log_info "  - Health: http://localhost:3000/health"
        log_info "  - API Docs: http://localhost:3000/api-docs"
        log_info "  - API Base: http://localhost:3000/api"
    else
        log_warning "API health check failed. Check logs with: ./deploy.sh logs"
    fi
}

# Stop services
stop_services() {
    log_info "Stopping Aelus Aether MCP services..."
    docker-compose down
    log_success "Services stopped."
}

# Restart services
restart_services() {
    log_info "Restarting Aelus Aether MCP services..."
    docker-compose restart
    log_success "Services restarted."
}

# Show logs
show_logs() {
    log_info "Showing logs (Ctrl+C to exit)..."
    docker-compose logs -f
}

# Show status
show_status() {
    log_info "Service Status:"
    docker-compose ps
    echo ""

    log_info "Health Check:"
    if curl -f http://localhost:3000/health 2>/dev/null | jq . 2>/dev/null; then
        log_success "API is responding"
    else
        log_error "API is not responding"
    fi
    echo ""

    log_info "Resource Usage:"
    docker stats --no-stream aelus-mcp-server 2>/dev/null || log_warning "Container not running"
}

# Update services
update_services() {
    log_info "Updating Aelus Aether MCP to latest version..."

    # Pull latest code
    log_info "Pulling latest changes from git..."
    git pull origin master

    # Rebuild image
    log_info "Rebuilding Docker image..."
    docker-compose build --no-cache

    # Restart services
    log_info "Restarting services..."
    docker-compose down
    docker-compose up -d

    log_success "Update completed!"
    show_status
}

# Backup data
backup_data() {
    log_info "Backing up MCP database..."

    BACKUP_DIR="$SCRIPT_DIR/backups"
    mkdir -p "$BACKUP_DIR"

    BACKUP_FILE="$BACKUP_DIR/mcp-backup-$(date +%Y%m%d-%H%M%S).tar.gz"

    docker run --rm \
        -v aelus-aether-mcp_aelus-mcp-data:/data \
        -v "$BACKUP_DIR":/backup \
        alpine tar czf "/backup/$(basename "$BACKUP_FILE")" /data

    log_success "Backup created: $BACKUP_FILE"
}

# Clean up
cleanup() {
    log_warning "This will remove all containers, images, and volumes!"
    read -p "Are you sure? (yes/no): " -r
    echo
    if [[ $REPLY == "yes" ]]; then
        log_info "Cleaning up..."
        docker-compose down -v --rmi all
        log_success "Cleanup completed."
    else
        log_info "Cleanup cancelled."
    fi
}

# Show help
show_help() {
    echo "Aelus Aether MCP - Deployment Script"
    echo ""
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start      Start all services"
    echo "  stop       Stop all services"
    echo "  restart    Restart all services"
    echo "  logs       Show service logs (follow mode)"
    echo "  status     Show service status and health"
    echo "  update     Update to latest version"
    echo "  backup     Backup database"
    echo "  cleanup    Remove all containers and volumes"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh start     # Start services"
    echo "  ./deploy.sh logs      # View logs"
    echo "  ./deploy.sh status    # Check status"
    echo ""
}

# Main script
case "${1:-help}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    update)
        update_services
        ;;
    backup)
        backup_data
        ;;
    cleanup)
        cleanup
        ;;
    help|--help|-h|*)
        show_help
        ;;
esac
