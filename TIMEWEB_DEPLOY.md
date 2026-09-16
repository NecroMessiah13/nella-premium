# 🌐 Деплой на Timeweb (VPS)

Пошаговое руководство для переноса Nella Premium на Timeweb VPS в РФ.

---

## Шаг 1 — VPS

- Тариф: **2 vCPU / 4 ГБ RAM / 50 ГБ NVME / 1 Гбит/с** (Timeweb Cloud) — 1 000 ₽/мес + 200 ₽ публичный IP = **1 200 ₽/мес**.
- Ubuntu 24.04.
- Регион: там же, где магазин (СПб / Москва).
- 4 ГБ выбрано ради сборки Next.js (build требует до 3 ГБ heap), с запасом под рантайм.

## Шаг 2 — DNS

- Панель → Домены → ваш домен (например `nella.ru`).
- A-записи: `@` и `www` → IP сервера.

## Шаг 3 — SSH + Docker

```bash
ssh root@ВАШ_IP

# Ubuntu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER && newgrp docker
```

## Шаг 4 — код на сервер

```bash
git clone <ваш-репозиторий> nella-fullstack
cd nella-fullstack
```

## Шаг 5 — Production `.env`

```bash
cat > .env << 'EOF'
POSTGRES_PASSWORD="СИЛЬНЫЙ_ПАРОЛЬ"
AUTH_SECRET="$(openssl rand -hex 32)"
ADMIN_EMAIL="admin@nella.ru"
ADMIN_PASSWORD="ОЧЕНЬ_СИЛЬНЫЙ"
APP_URL="https://nella.ru"
COOKIE_SECURE="true"
SMTP_HOST="ваш_smtp"          # напр. smtp.yandex.ru
SMTP_PORT="465"
SMTP_USER="..."
SMTP_PASSWORD="..."
SMTP_FROM="noreply@nella.ru"
SMTP_FROM_NAME="Nella Premium"
YOOKASSA_RETURN_URL="https://nella.ru/payment/success"
# YOOKASSA / CDEK / OZON / Google / Apple — по факту
EOF
```

⚠️ `COOKIE_SECURE` обязательно `true`, иначе при HTTPS кука не ставится.

## Шаг 6 — перенос существующей БД

На локальной машине:

```bash
docker exec nella-postgres pg_dump -U nella nella > backup.sql
```

Скопировать `backup.sql` на сервер (scp) в `~/` и восстановить:

```bash
cd nella-fullstack
docker compose up -d postgres
docker compose ps            # ждать healthy
docker exec -i nella-postgres psql -U nella nella < ~/backup.sql
```

## Шаг 7 — сборка и запуск

```bash
docker compose build app
docker compose up -d

# применить схему, если БД без дампа:
docker exec nella-app npx prisma db push
```

## Шаг 8 — SSL + reverse proxy (nginx)

```bash
sudo apt install -y nginx
```

Конфиг `/etc/nginx/sites-available/nella` (proxy_pass на `http://localhost:3000`), затем:

```bash
sudo ln -s /etc/nginx/sites-available/nella /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d nella.ru -d www.nella.ru
```

## Шаг 9 — фаервол

```bash
sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
sudo ufw enable
```

## Шаг 10 — бэкапы БД по cron

```bash
sudo mkdir -p /root/backups
sudo crontab -e
# 3:00 ежедневно, хранить 7 дней:
0 3 * * * docker exec nella-postgres pg_dump -U nella nella | gzip > /root/backups/nella_$(date +\%F).sql.gz && find /root/backups -mtime +7 -delete
```

---

## Проверка перед запуском

- [ ] `https://nella.ru` открывается
- [ ] Админка (`ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- [ ] Тестовый заказ → письма → оплата YooKassa
- [ ] Бэкап восстановлен, товары/категории/настройки на месте