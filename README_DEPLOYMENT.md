# 🚀 FlyPlaza - Развернут на Timeweb.cloud

## ✅ Статус проекта

**Production версия готова к деплою!**

### 📦 Что готово:

- ✅ Docker конфигурация
- ✅ Docker Compose оркестрация
- ✅ Автоматический скрипт установки
- ✅ Firewall конфигурация
- ✅ Production оптимизации
- ✅ Полная документация

---

## 🎯 Быстрый деплой на Timeweb.cloud

### Данные сервера:
```
IP:      31.130.147.54
IPv6:    2a03:6f01:1:2::1:913e
User:    root
```

### Автоматическая установка (1 команда):

```bash
ssh root@31.130.147.54
curl -fsSL https://raw.githubusercontent.com/fow830/flyplaza/main/setup-timeweb.sh | bash
```

После установки приложение будет доступно:
```
http://31.130.147.54:3002
```

---

## 📚 Документация

### Основные файлы:

1. **`INSTALL_NOW.md`** - Пошаговая инструкция для немедленной установки
2. **`CONNECT_INSTRUCTIONS.md`** - Подробное руководство по подключению
3. **`DEPLOYMENT.md`** - Полная документация по деплою
4. **`TIMEWEB_QUICK_START.md`** - Быстрый старт для Timeweb
5. **`setup-timeweb.sh`** - Автоматический скрипт установки

### Скрипты деплоя:

- **`deploy.sh`** - Основной скрипт деплоя приложения
- **`setup-timeweb.sh`** - Полная установка на сервер
- **`Dockerfile`** - Production Docker образ
- **`docker-compose.yml`** - Оркестрация контейнеров

---

## 🔧 Конфигурация

### Environment Variables (.env)

```bash
AVIASALES_API_TOKEN=your_token_here
NODE_ENV=production
PORT=3002
```

### Порты:

- **3002** - HTTP приложение
- **80** - HTTP (для Nginx)
- **443** - HTTPS (для Nginx с SSL)

### Firewall:

```bash
ufw allow ssh
ufw allow 3002/tcp
ufw allow 80/tcp
ufw allow 443/tcp
```

---

## 📊 Архитектура

```
┌─────────────────────────────────────────┐
│         User Browser                    │
└──────────────┬──────────────────────────┘
               │
               │ HTTP :3002
               ▼
┌─────────────────────────────────────────┐
│         Docker Container                │
│  ┌───────────────────────────────────┐  │
│  │   Next.js Application             │  │
│  │   - Frontend (React)              │  │
│  │   - Backend API Routes            │  │
│  │   - SSR/SSG                       │  │
│  └───────────┬───────────────────────┘  │
│              │                           │
│              ▼                           │
│  ┌───────────────────────────────────┐  │
│  │   Aviasales API                   │  │
│  │   (External)                      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 🚀 Процесс деплоя

### 1. Сборка Docker образа

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3002
CMD ["node", "server.js"]
```

### 2. Запуск через Docker Compose

```yaml
services:
  flyplaza:
    build: .
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - AVIASALES_API_TOKEN=${AVIASALES_API_TOKEN}
```

### 3. Health Check

Приложение автоматически проверяется на доступность:
- Интервал: 30 секунд
- Таймаут: 10 секунд
- Повторы: 3

---

## 📈 Мониторинг

### Просмотр логов:

```bash
cd /var/www/flyplaza
docker-compose logs -f
```

### Статус контейнеров:

```bash
docker-compose ps
docker stats
```

### Системные ресурсы:

```bash
htop
free -h
df -h
```

---

## 🔄 Обновление

### Автоматическое обновление:

```bash
cd /var/www/flyplaza
git pull origin main
./deploy.sh
```

### Ручное обновление:

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 🌐 Настройка домена (опционально)

### 1. Установка Nginx

```bash
apt install nginx -y
```

### 2. Конфигурация

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. SSL сертификат

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d your-domain.com
```

---

## 🔐 Безопасность

### Firewall (UFW):
```bash
ufw enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 3002/tcp
ufw allow 80/tcp
ufw allow 443/tcp
```

### Автоматические обновления:
```bash
apt install unattended-upgrades -y
dpkg-reconfigure -plow unattended-upgrades
```

---

## 💰 Стоимость хостинга

**Timeweb.cloud:**
- Cloud Mini (1GB RAM): ~300₽/месяц
- Cloud Small (2GB RAM): ~500₽/месяц
- Cloud Medium (4GB RAM): ~1000₽/месяц

**Рекомендация:** Cloud Mini достаточно для старта

---

## 🔗 Полезные ссылки

- 🌐 **GitHub**: https://github.com/fow830/flyplaza
- 📦 **Release**: https://github.com/fow830/flyplaza/releases/tag/v1.0.0
- 🏠 **Timeweb**: https://timeweb.cloud
- 🎫 **Travelpayouts**: https://www.travelpayouts.com/developers/api

---

## 📞 Поддержка

- 🐛 **Issues**: https://github.com/fow830/flyplaza/issues
- 📧 **Email**: support@flyplaza.com
- 📖 **Docs**: См. файлы в репозитории

---

## ✨ Версия

**FlyPlaza v1.0.0**
- Дата релиза: 11 ноября 2025
- Статус: Production Ready
- Лицензия: MIT

---

**🚀 Готово к деплою! Начните установку прямо сейчас!**

