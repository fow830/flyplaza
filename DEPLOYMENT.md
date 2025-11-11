# 🚀 FlyPlaza Deployment Guide for Timeweb.cloud

## Содержание
- [Требования](#требования)
- [Подготовка](#подготовка)
- [Метод 1: Docker деплой](#метод-1-docker-деплой-рекомендуется)
- [Метод 2: Прямой Node.js деплой](#метод-2-прямой-nodejs-деплой)
- [Настройка домена](#настройка-домена)
- [SSL сертификат](#ssl-сертификат)
- [Мониторинг](#мониторинг)

---

## Требования

- VPS на Timeweb.cloud (минимум 1GB RAM, 1 CPU)
- Ubuntu 20.04 или новее
- Docker и Docker Compose (для метода 1)
- Node.js 18+ (для метода 2)
- Aviasales API токен от Travelpayouts

---

## Подготовка

### 1. Создание VPS на Timeweb.cloud

1. Войдите в панель управления Timeweb.cloud
2. Перейдите в раздел "Облачные серверы"
3. Нажмите "Создать сервер"
4. Выберите конфигурацию:
   - OS: Ubuntu 22.04 LTS
   - RAM: минимум 1GB (рекомендуется 2GB)
   - CPU: 1 vCPU
   - Диск: 10GB SSD
5. Создайте и сохраните SSH ключ или пароль

### 2. Подключение к серверу

```bash
ssh root@your-server-ip
```

### 3. Обновление системы

```bash
apt update && apt upgrade -y
```

---

## Метод 1: Docker деплой (рекомендуется)

### Шаг 1: Установка Docker

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установка Docker Compose
apt install docker-compose -y

# Проверка установки
docker --version
docker-compose --version
```

### Шаг 2: Клонирование проекта

```bash
# Создайте директорию для приложения
mkdir -p /var/www/flyplaza
cd /var/www/flyplaza

# Клонируйте репозиторий
git clone https://github.com/fow830/flyplaza.git .
git checkout main
```

### Шаг 3: Настройка переменных окружения

```bash
# Создайте .env файл
cp .env.example .env

# Отредактируйте .env файл
nano .env
```

Добавьте ваш Aviasales API токен:
```env
AVIASALES_API_TOKEN=your_real_token_here
NODE_ENV=production
PORT=3002
```

Сохраните: `Ctrl+X`, затем `Y`, затем `Enter`

### Шаг 4: Запуск приложения

```bash
# Дайте права на выполнение скрипту
chmod +x deploy.sh

# Запустите деплой
./deploy.sh
```

Или вручную:

```bash
# Сборка и запуск
docker-compose up -d

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

### Шаг 5: Проверка работы

```bash
# Проверка доступности
curl http://localhost:3002

# Если возвращается HTML - приложение работает!
```

---

## Метод 2: Прямой Node.js деплой

### Шаг 1: Установка Node.js

```bash
# Установка Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Установка PM2 для управления процессом
npm install -g pm2

# Проверка
node --version
npm --version
pm2 --version
```

### Шаг 2: Клонирование и установка зависимостей

```bash
# Создайте директорию
mkdir -p /var/www/flyplaza
cd /var/www/flyplaza

# Клонируйте репозиторий
git clone https://github.com/fow830/flyplaza.git .
git checkout main

# Установите зависимости
npm ci --production=false
```

### Шаг 3: Настройка переменных окружения

```bash
# Создайте .env файл
cp .env.example .env
nano .env
```

Добавьте токен:
```env
AVIASALES_API_TOKEN=your_real_token_here
NODE_ENV=production
PORT=3002
```

### Шаг 4: Сборка и запуск

```bash
# Сборка приложения
npm run build

# Запуск с PM2
pm2 start npm --name "flyplaza" -- start

# Сохранение конфигурации PM2
pm2 save
pm2 startup

# Проверка статуса
pm2 status
pm2 logs flyplaza
```

---

## Настройка Nginx (обратный прокси)

### Установка Nginx

```bash
apt install nginx -y
```

### Конфигурация

```bash
nano /etc/nginx/sites-available/flyplaza
```

Добавьте конфигурацию:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируйте конфигурацию:

```bash
ln -s /etc/nginx/sites-available/flyplaza /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## Настройка домена

### В панели Timeweb.cloud:

1. Перейдите в раздел "Домены"
2. Добавьте ваш домен
3. Настройте A-запись:
   - Имя: `@` (или оставьте пустым)
   - Тип: A
   - Значение: IP вашего VPS
4. Добавьте CNAME для www:
   - Имя: `www`
   - Тип: CNAME
   - Значение: `your-domain.com`

Подождите 5-15 минут для распространения DNS.

---

## SSL сертификат (Let's Encrypt)

```bash
# Установка Certbot
apt install certbot python3-certbot-nginx -y

# Получение сертификата
certbot --nginx -d your-domain.com -d www.your-domain.com

# Автоматическое обновление
certbot renew --dry-run
```

Certbot автоматически настроит Nginx для использования HTTPS.

---

## Управление приложением

### Docker метод:

```bash
# Остановка
docker-compose down

# Запуск
docker-compose up -d

# Перезапуск
docker-compose restart

# Логи
docker-compose logs -f

# Обновление
cd /var/www/flyplaza
git pull origin main
./deploy.sh
```

### PM2 метод:

```bash
# Остановка
pm2 stop flyplaza

# Запуск
pm2 start flyplaza

# Перезапуск
pm2 restart flyplaza

# Логи
pm2 logs flyplaza

# Обновление
cd /var/www/flyplaza
git pull origin main
npm ci --production=false
npm run build
pm2 restart flyplaza
```

---

## Мониторинг

### Проверка статуса

```bash
# Docker
docker-compose ps
docker stats

# PM2
pm2 status
pm2 monit

# Системные ресурсы
htop
free -h
df -h
```

### Логи

```bash
# Docker
docker-compose logs -f --tail=100

# PM2
pm2 logs flyplaza --lines 100

# Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## Резервное копирование

### Создание бэкапа

```bash
# Создайте директорию для бэкапов
mkdir -p /backup/flyplaza

# Бэкап кода и конфигурации
cd /var/www
tar -czf /backup/flyplaza/flyplaza-$(date +%Y%m%d-%H%M%S).tar.gz flyplaza/

# Автоматический бэкап (добавьте в crontab)
crontab -e
# Добавьте строку:
# 0 2 * * * cd /var/www && tar -czf /backup/flyplaza/flyplaza-$(date +\%Y\%m\%d).tar.gz flyplaza/
```

---

## Troubleshooting

### Приложение не запускается

1. Проверьте логи:
   ```bash
   docker-compose logs
   # или
   pm2 logs flyplaza
   ```

2. Проверьте переменные окружения:
   ```bash
   cat .env
   ```

3. Проверьте доступность порта:
   ```bash
   netstat -tulpn | grep 3002
   ```

### Ошибки API

1. Проверьте токен Aviasales:
   ```bash
   echo $AVIASALES_API_TOKEN
   ```

2. Проверьте логи API:
   ```bash
   tail -f /tmp/flyplaza-api.log
   ```

### Проблемы с Nginx

```bash
# Проверка конфигурации
nginx -t

# Перезапуск
systemctl restart nginx

# Логи
tail -f /var/log/nginx/error.log
```

---

## Безопасность

### Firewall (UFW)

```bash
# Установка и настройка
apt install ufw -y
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

### Обновления безопасности

```bash
# Автоматические обновления
apt install unattended-upgrades -y
dpkg-reconfigure -plow unattended-upgrades
```

---

## Производительность

### Кеширование

Nginx уже настроен для кеширования статических файлов.

### Оптимизация Node.js

В `.env` добавьте:
```env
NODE_OPTIONS="--max-old-space-size=512"
```

---

## Поддержка

- 📧 Email: support@your-domain.com
- 🐛 Issues: https://github.com/fow830/flyplaza/issues
- 📖 Docs: https://github.com/fow830/flyplaza

---

## Checklist деплоя

- [ ] VPS создан и доступен
- [ ] Docker/Node.js установлен
- [ ] Код клонирован
- [ ] .env файл настроен с API токеном
- [ ] Приложение запущено
- [ ] Nginx настроен
- [ ] Домен привязан
- [ ] SSL сертификат установлен
- [ ] Firewall настроен
- [ ] Мониторинг настроен
- [ ] Бэкапы настроены

---

**Готово! FlyPlaza запущен на Timeweb.cloud! 🚀**

