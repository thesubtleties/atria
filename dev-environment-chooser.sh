#!/bin/bash

# Interactive script to choose development environment

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        ${CYAN}Atria Development Environment Chooser${BLUE}         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}Choose your development environment:${NC}"
echo ""

echo -e "${YELLOW}1) Standard Local Development${NC}"
echo "   • Single backend instance"
echo "   • No Redis (in-memory Socket.IO)"
echo "   • Direct port access (5000, 5173)"
echo "   • Simpler, faster startup"
echo "   • Best for: General development, UI work"
echo ""

echo -e "${YELLOW}2) Redis + Traefik Development${NC}"
echo "   • Two backend instances (clustered)"
echo "   • Redis for Socket.IO + caching"
echo "   • Traefik load balancer (port 80)"
echo "   • Production-like environment"
echo "   • Best for: Testing clustering, Socket.IO, caching"
echo ""

echo -e "${YELLOW}3) Production Preview (nginx)${NC}"
echo "   • Builds frontend with pre-rendering"
echo "   • Serves with nginx (compression, HTTP/2)"
echo "   • Production-accurate performance"
echo "   • No hot reload"
echo "   • Best for: Testing SEO, performance, production builds"
echo ""

echo -e "${YELLOW}4) Tailscale Mobile Testing${NC}"
echo "   • Redis + Traefik (production-like)"
echo "   • Configured for Tailscale remote access"
echo "   • Two backend instances (clustered)"
echo "   • Best for: Mobile/phone testing, remote access"
echo ""

echo -e "${YELLOW}5) Check Status${NC}"
echo "   • See what's currently running"
echo ""

echo -e "${YELLOW}6) Stop All${NC}"
echo "   • Stop any running environments"
echo ""

echo -e "${YELLOW}7) Exit${NC}"
echo ""

read -p "Enter choice [1-7]: " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}Starting Standard Local Development...${NC}"
        ./start-local-dev-tmux.sh
        ;;
    2)
        echo ""
        echo -e "${GREEN}Starting Redis + Traefik Development...${NC}"
        # Check if we should seed the database
        read -p "Seed the database? (y/N): " seed_choice
        if [[ $seed_choice =~ ^[Yy]$ ]]; then
            export SEED_DB=true
        else
            export SEED_DB=false
        fi
        ./start-redis-dev-tmux.sh
        ;;
    3)
        echo ""
        echo -e "${GREEN}Starting Production Preview Environment...${NC}"
        # Check if we should seed the database
        read -p "Seed the database? (y/N): " seed_choice
        if [[ $seed_choice =~ ^[Yy]$ ]]; then
            export SEED_DB=true
        else
            export SEED_DB=false
        fi
        ./start-preview-tmux.sh
        ;;
    4)
        echo ""
        echo -e "${GREEN}Starting Tailscale Mobile Testing Environment...${NC}"
        # Check if we should seed the database
        read -p "Seed the database? (y/N): " seed_choice
        if [[ $seed_choice =~ ^[Yy]$ ]]; then
            export SEED_DB=true
        else
            export SEED_DB=false
        fi
        ./start-tailscale-dev-tmux.sh
        ;;
    5)
        echo ""
        echo -e "${CYAN}Checking running environments...${NC}"
        echo ""

        # Check tmux sessions
        echo "Tmux sessions:"
        tmux ls 2>/dev/null || echo "  No tmux sessions running"
        echo ""

        # Check docker containers
        echo "Docker containers:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "atria-|NAME" || echo "  No Atria containers running"
        echo ""

        # Check which compose file is active
        if docker ps | grep -q "atria-redis-tailscale"; then
            echo -e "${GREEN}✓ Tailscale environment is running${NC}"
            echo "  Stop with: ./stop-tailscale-dev-tmux.sh"
        elif docker ps | grep -q "atria-redis-dev"; then
            echo -e "${GREEN}✓ Redis environment is running${NC}"
            echo "  Stop with: ./stop-redis-dev-tmux.sh"
        elif docker ps | grep -q "atria-api-preview"; then
            echo -e "${GREEN}✓ Production Preview environment is running${NC}"
            echo "  Stop with: ./stop-preview-tmux.sh"
            echo "  Frontend: http://localhost:8080"
        elif docker ps | grep -q "atria-api-dev"; then
            echo -e "${GREEN}✓ Standard environment is running${NC}"
            echo "  Stop with: ./stop-local-dev-tmux.sh"
        else
            echo -e "${YELLOW}No Atria environment detected${NC}"
        fi
        ;;
    6)
        echo ""
        echo -e "${YELLOW}Stopping all environments...${NC}"
        ./stop-local-dev-tmux.sh 2>/dev/null
        ./stop-redis-dev-tmux.sh 2>/dev/null
        ./stop-tailscale-dev-tmux.sh 2>/dev/null
        ./stop-preview-tmux.sh 2>/dev/null
        echo -e "${GREEN}✅ All environments stopped${NC}"
        ;;
    7)
        echo -e "${CYAN}Goodbye!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac