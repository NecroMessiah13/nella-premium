# 🚀 Deployment Guide

## Развёртывание Nella Premium в продакшене

---

## 🏭 Вариант 1: Docker Compose на VPS

### Требования

- VPS с Docker + Docker Compose
- Домен (например, nella.ru)
- SSL сертификат (Let's Encrypt)
- 2GB+ RAM, 20GB+ дискового пространства

### Шаги

#### 1. Подключись к серверу

```bash
ssh user@your-vps-ip
```

#### 2. Установи Docker (если нет)

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

#### 3. Клонируй проект

```bash
git clone <your-repo> nella-fullstack
cd nella-fullstack
```

#### 4. Создай Production `.env`

```bash
cat > .env << 'EOF'
# DATABASE
DATABASE_URL="postgresql://nella:STRONG_PASSWORD@postgres:5432/nella?schema=public"
POSTGRES_PASSWORD="STRONG_PASSWORD"

# AUTH
AUTH_SECRET="$(openssl rand -hex 32)"
ADMIN_EMAIL="admin@nella.ru"
ADMIN_PASSWORD="VERY_STRONG_ADMIN_PASSWORD"

# APP
NODE_ENV="production"
APP_URL="https://nella.ru"
COOKIE_SECURE="true"

# EMAIL - Mailtrap
SMTP_HOST="live.smtp.mailtrap.io"
SMTP_PORT="587"
SMTP_USER="your_mailtrap_username"
SMTP_PASSWORD="your_mailtrap_api_token"
SMTP_FROM="noreply@nella.ru"
SMTP_FROM_NAME="Nella Premium"

# YOOKASSA - Боевые ключи
YOOKASSA_SHOP_ID="YOUR_REAL_SHOP_ID"
YOOKASSA_SECRET_KEY="YOUR_REAL_SECRET_KEY"
YOOKASSA_RETURN_URL="https://nella.ru/payment/success"
YOOKASSA_MODE="live"

# LOGISTICS
CDEK_API_KEY="YOUR_CDEK_KEY"
CDEK_ACCOUNT="YOUR_CDEK_ACCOUNT"
OZON_API_KEY="YOUR_OZON_KEY"
EOF
```

#### 5. Создай Nginx конфиг (опционально для reverse proxy)

```bash
sudo cat > /etc/nginx/sites-available/nella << 'EOF'
server {
    listen 80;
    server_name nella.ru www.nella.ru;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/nella /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. Добавь SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d nella.ru -d www.nella.ru
```

#### 7. Запусти приложение

```bash
docker compose up -d
```

#### 8. Проверь статус

```bash
docker compose ps
docker compose logs -f nella-app
```

---

## 📦 Вариант 2: Vercel (Next.js оптимизирован)

### Требования

- GitHub аккаунт
- Vercel аккаунт (https://vercel.com)
- Нужна ОТДЕЛЬНАЯ Postgres БД (например, Supabase)

### Шаги

#### 1. Подготовь GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/nella-fullstack.git
git branch -M main
git push -u origin main
```

#### 2. Создай внешнюю БД (Supabase)

- Зарегистрируйся на https://supabase.io
- Создай новый проект
- Получи `DATABASE_URL`
- Запусти миграции:

```bash
DATABASE_URL="your_supabase_url" npx prisma migrate deploy
DATABASE_URL="your_supabase_url" npx prisma db seed
```

#### 3. Импортируй на Vercel

- Перейди https://vercel.com/new
- Выбери GitHub репозиторий
- Добавь Environment Variables из `.env`
- Деплой!

#### 4. Настрой кастомный домен

- В Vercel Settings → Domains
- Добавь nella.ru
- Обнови DNS записи у регистратора

---

## 🐳 Вариант 3: Docker Hub + Docker Swarm

### Push на Docker Hub

```bash
# Залогинься
docker login

# Тегируй образ
docker tag nella-app YOUR_USERNAME/nella-app:latest

# Push
docker push YOUR_USERNAME/nella-app:latest
```

### Деплой на Swarm

```bash
# Инициализируй Swarm на основном ноде
docker swarm init

# Создай stack с docker-compose
docker stack deploy -c docker-compose.yml nella
```

---

## 🔄 Continuous Deployment (GitHub Actions)

### Создай `.github/workflows/deploy.yml`

```yaml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd ~/nella-fullstack
            git pull origin main
            docker compose pull
            docker compose up -d
```

### Добавь Secrets на GitHub

Settings → Secrets:
- `VPS_HOST` — IP адрес сервера
- `VPS_USER` — username
- `VPS_SSH_KEY` — приватный SSH ключ

---

## 📊 Мониторинг

### Логи в реал-времени

```bash
docker compose logs -f nella-app
```

### Статус сервисов

```bash
docker compose ps
```

### Использование ресурсов

```bash
docker stats
```

### Backup БД

```bash
docker exec nella-postgres pg_dump -U nella nella > backup.sql
```

### Restore БД

```bash
docker exec -i nella-postgres psql -U nella nella < backup.sql
```

---

## 🚨 Troubleshooting в продакшене

### Приложение не запускается

```bash
# Проверь логи
docker compose logs nella-app

# Проверь что .env заполнен
docker exec nella-app env | grep DATABASE_URL

# Проверь БД
docker exec nella-postgres pg_isready -U nella
```

### Высокое использование памяти

```bash
# Увеличь лимит в docker-compose.yml
environment:
  NODE_OPTIONS: "--max-old-space-size=4096"

# Перезагрузи
docker compose restart nella-app
```

### Письма не отправляются

```bash
# Проверь SMTP конфиг
docker exec nella-app env | grep SMTP

# Проверь конекшн к Mailtrap
telnet live.smtp.mailtrap.io 587
```

### БД испольнена

```bash
# Очистить старые логи
docker exec nella-postgres psql -U nella nella -c "VACUUM FULL"

# Увеличить дис пространство на VPS
df -h
# если требуется расширение — свяжись с хостером
```

---

## 🔐 Безопасность в продакшене

### ✅ Обязательно

- [ ] Используй HTTPS (Let's Encrypt)
- [ ] Замени все пароли на сильные
- [ ] Используй разные ключи для разработки и продакшена
- [ ] Включи брандмауэр (firewall)
- [ ] Ограничь SSH доступ

```bash
# Firewall (UFW)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

- [ ] Регулярно обновляй Docker образы

```bash
docker compose pull
docker compose up -d
```

### SSH ключи вместо паролей

```bash
# На локальной машине
ssh-keygen -t ed25519

# На сервере
mkdir ~/.ssh
cat >> ~/.ssh/authorized_keys < your_public_key.pub
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Отключи пароли
sudo nano /etc/ssh/sshd_config
# Измени: PasswordAuthentication no
sudo systemctl restart ssh
```

---

## 📈 Масштабирование

### Если нужно больше power:

1. **Вертикально** — увеличить RAM/CPU на сервере
2. **Горизонтально** — добавить несколько серверов + load balancer (Nginx)
3. **CDN** — для статических файлов (Cloudflare)
4. **Database** — отдельный хост для Postgres

---

## 📝 Checklist перед запуском

- [ ] Все переменные в `.env` заполнены
- [ ] SMTP настроен (Mailtrap или другой)
- [ ] YooKassa ключи добавлены
- [ ] SSL сертификат установлен
- [ ] Backups БД настроены
- [ ] Мониторинг включен
- [ ] Админ пароль изменен
- [ ] Domain указывает на сервер
- [ ] Docker образы обновлены
- [ ] Тестовый заказ создан и проверен

---

## 📞 Помощь

Если что-то не работает:

1. Проверь логи: `docker compose logs`
2. Убедись что все ports свободны
3. Проверь DNS: `nslookup nella.ru`
4. Проверь SSL: `curl -I https://nella.ru`
5. Создай issue на GitHub

