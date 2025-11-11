# 🔐 Подключение к серверу Timeweb.cloud

## 📋 Данные для подключения

```
IP адрес:  31.130.147.54
IPv6:      2a03:6f01:1:2::1:913e
SSH:       ssh root@31.130.147.54
Пароль:    di5DZhVMh@56k.
```

---

## 🚀 Быстрая установка (копируй и вставляй)

### Шаг 1: Подключитесь к серверу

```bash
ssh root@31.130.147.54
```

Введите пароль: `di5DZhVMh@56k.`

### Шаг 2: Запустите автоматическую установку

Скопируйте и вставьте эту команду целиком:

```bash
curl -fsSL https://raw.githubusercontent.com/fow830/flyplaza/main/setup-timeweb.sh | bash
```

**Или вручную:**

```bash
# Скачайте скрипт
wget https://raw.githubusercontent.com/fow830/flyplaza/main/setup-timeweb.sh

# Дайте права на выполнение
chmod +x setup-timeweb.sh

# Запустите
./setup-timeweb.sh
```

### Шаг 3: Настройте API токен

Когда скрипт попросит, откройте файл .env:

```bash
nano /var/www/flyplaza/.env
```

Замените строку:
```
AVIASALES_API_TOKEN=your_aviasales_token_here
```

На ваш реальный токен от Travelpayouts:
```
AVIASALES_API_TOKEN=ваш_настоящий_токен
```

**Сохраните:** Нажмите `Ctrl+X`, затем `Y`, затем `Enter`

### Шаг 4: Готово!

Откройте в браузере:
```
http://31.130.147.54:3002
```

🎉 **FlyPlaza работает!**

---

## 📝 Ручная установка (если автоматическая не сработала)

```bash
# 1. Обновите систему
apt update && apt upgrade -y

# 2. Установите Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose -y

# 3. Установите Git
apt install git -y

# 4. Клонируйте проект
mkdir -p /var/www && cd /var/www
git clone https://github.com/fow830/flyplaza.git
cd flyplaza
git checkout main

# 5. Настройте .env
cp .env.example .env
nano .env
# Замените your_aviasales_token_here на ваш токен
# Сохраните: Ctrl+X → Y → Enter

# 6. Настройте firewall
apt install ufw -y
ufw allow ssh
ufw allow 3002/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# 7. Запустите приложение
chmod +x deploy.sh
./deploy.sh
```

---

## 🔑 Как получить Aviasales API токен

1. Зарегистрируйтесь на https://www.travelpayouts.com
2. Войдите в личный кабинет
3. Перейдите в раздел **API** → **Aviasales**
4. Скопируйте ваш **API Token**
5. Вставьте его в файл `.env` на сервере

---

## 🌐 Настройка домена (опционально)

### Установите Nginx

```bash
apt install nginx -y
```

### Создайте конфигурацию

```bash
nano /etc/nginx/sites-available/flyplaza
```

Вставьте (замените `ваш-домен.ru`):

```nginx
server {
    listen 80;
    server_name ваш-домен.ru www.ваш-домен.ru;

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

Сохраните: `Ctrl+X → Y → Enter`

### Активируйте

```bash
ln -s /etc/nginx/sites-available/flyplaza /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Настройте DNS

В панели Timeweb.cloud или у регистратора домена:
- Добавьте **A-запись**: `@` → `31.130.147.54`
- Добавьте **CNAME**: `www` → `ваш-домен.ru`

### Установите SSL (HTTPS)

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d ваш-домен.ru -d www.ваш-домен.ru
```

Следуйте инструкциям на экране.

🔒 **Теперь ваш сайт работает по HTTPS!**

---

## 📊 Полезные команды

### Управление приложением

```bash
# Просмотр логов
cd /var/www/flyplaza
docker-compose logs -f

# Перезапуск
docker-compose restart

# Остановка
docker-compose down

# Запуск
docker-compose up -d

# Статус
docker-compose ps

# Использование ресурсов
docker stats
```

### Обновление приложения

```bash
cd /var/www/flyplaza
git pull origin main
./deploy.sh
```

### Системные ресурсы

```bash
# CPU и RAM
htop

# Свободное место
df -h

# Память
free -h

# Открытые порты
netstat -tulpn
```

---

## 🆘 Troubleshooting

### Не удается подключиться по SSH

```bash
# Попробуйте с IPv6
ssh root@2a03:6f01:1:2::1:913e
```

### Приложение не запускается

```bash
# Проверьте логи
docker-compose logs

# Проверьте порт
netstat -tulpn | grep 3002

# Проверьте .env
cat /var/www/flyplaza/.env
```

### Не работает поиск билетов

```bash
# Проверьте API токен
cd /var/www/flyplaza
cat .env | grep AVIASALES_API_TOKEN

# Проверьте логи API
tail -f /tmp/flyplaza-api.log
```

### Порт 3002 заблокирован

```bash
# Проверьте firewall
ufw status

# Откройте порт
ufw allow 3002/tcp
```

---

## 📞 Контакты

- 🐙 **GitHub**: https://github.com/fow830/flyplaza
- 🐛 **Issues**: https://github.com/fow830/flyplaza/issues
- 📖 **Docs**: См. DEPLOYMENT.md

---

## ✅ Checklist

- [ ] Подключился по SSH
- [ ] Запустил автоматическую установку
- [ ] Настроил API токен в .env
- [ ] Приложение запущено
- [ ] Открывается http://31.130.147.54:3002
- [ ] (Опционально) Домен настроен
- [ ] (Опционально) SSL установлен

---

**Готово! Наслаждайтесь FlyPlaza! ✈️**

