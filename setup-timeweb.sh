#!/bin/bash

# FlyPlaza - Автоматическая установка на Timeweb.cloud
# Версия: 1.0.0

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║     🚀 FlyPlaza Installation on Timeweb.cloud 🚀          ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Step 1: Update system
echo -e "${BLUE}[1/8]${NC} ${CYAN}Обновление системы...${NC}"
apt update -qq && apt upgrade -y -qq
echo -e "${GREEN}✅ Система обновлена${NC}"
echo ""

# Step 2: Install Docker
echo -e "${BLUE}[2/8]${NC} ${CYAN}Установка Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh > /dev/null 2>&1
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker установлен${NC}"
else
    echo -e "${YELLOW}⚠️  Docker уже установлен${NC}"
fi
echo ""

# Step 3: Install Docker Compose
echo -e "${BLUE}[3/8]${NC} ${CYAN}Установка Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    apt install docker-compose -y -qq
    echo -e "${GREEN}✅ Docker Compose установлен${NC}"
else
    echo -e "${YELLOW}⚠️  Docker Compose уже установлен${NC}"
fi
echo ""

# Step 4: Install Git
echo -e "${BLUE}[4/8]${NC} ${CYAN}Установка Git...${NC}"
if ! command -v git &> /dev/null; then
    apt install git -y -qq
    echo -e "${GREEN}✅ Git установлен${NC}"
else
    echo -e "${YELLOW}⚠️  Git уже установлен${NC}"
fi
echo ""

# Step 5: Clone repository
echo -e "${BLUE}[5/8]${NC} ${CYAN}Клонирование FlyPlaza...${NC}"
mkdir -p /var/www
cd /var/www

if [ -d "flyplaza" ]; then
    echo -e "${YELLOW}⚠️  Директория flyplaza уже существует. Обновляю...${NC}"
    cd flyplaza
    git pull origin main
else
    git clone https://github.com/fow830/flyplaza.git
    cd flyplaza
    git checkout main
fi
echo -e "${GREEN}✅ Код загружен${NC}"
echo ""

# Step 6: Setup environment
echo -e "${BLUE}[6/8]${NC} ${CYAN}Настройка переменных окружения...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}📝 ВАЖНО! Отредактируйте файл .env и добавьте ваш Aviasales API токен:${NC}"
    echo -e "${PURPLE}   nano /var/www/flyplaza/.env${NC}"
    echo -e "${PURPLE}   Замените: your_aviasales_token_here${NC}"
    echo -e "${PURPLE}   На ваш токен от Travelpayouts${NC}"
    echo ""
    read -p "Нажмите Enter, когда будете готовы продолжить..."
else
    echo -e "${YELLOW}⚠️  Файл .env уже существует${NC}"
fi
echo ""

# Step 7: Configure firewall
echo -e "${BLUE}[7/8]${NC} ${CYAN}Настройка firewall...${NC}"
if ! command -v ufw &> /dev/null; then
    apt install ufw -y -qq
fi
ufw --force enable > /dev/null 2>&1 || true
ufw default deny incoming > /dev/null 2>&1 || true
ufw default allow outgoing > /dev/null 2>&1 || true
ufw allow ssh > /dev/null 2>&1 || true
ufw allow 3002/tcp > /dev/null 2>&1 || true
ufw allow 80/tcp > /dev/null 2>&1 || true
ufw allow 443/tcp > /dev/null 2>&1 || true
echo -e "${GREEN}✅ Firewall настроен${NC}"
echo ""

# Step 8: Build and start application
echo -e "${BLUE}[8/8]${NC} ${CYAN}Сборка и запуск FlyPlaza...${NC}"
chmod +x deploy.sh
./deploy.sh

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║           🎉 FlyPlaza установлен успешно! 🎉              ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✨ Ваше приложение доступно по адресу:${NC}"
echo -e "${CYAN}   http://31.130.147.54:3002${NC}"
echo ""
echo -e "${YELLOW}📋 Полезные команды:${NC}"
echo -e "${PURPLE}   docker-compose logs -f${NC}         - просмотр логов"
echo -e "${PURPLE}   docker-compose restart${NC}         - перезапуск"
echo -e "${PURPLE}   docker-compose down${NC}            - остановка"
echo -e "${PURPLE}   docker-compose ps${NC}              - статус контейнеров"
echo ""
echo -e "${GREEN}✅ Установка завершена!${NC}"

