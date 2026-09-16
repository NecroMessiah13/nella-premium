# 🚀 Запуск Nella Premium с Docker Compose

## 📋 Требования

- **Docker** (версия 20.10+)
- **Docker Compose** (версия 2.0+)
- **Git** (опционально, для клонирования)

### Проверка установки

```bash
docker --version
docker compose version
```

---

## 📥 Установка

### 1️⃣ Клонируй/скопируй проект

```bash
git clone <your-repo-url> nella-fullstack
cd nella-fullstack
```

Или если уже есть файлы — просто убедись что находишься в директории с `docker-compose.yml`.

### 2️⃣ Создай/проверь `.env` файл

**Пути создания .env:**

**Windows (PowerShell):**
```powershell
New-Item -Path .env -ItemType File
```

**macOS/Linux:**
```bash
touch .env
```

**Содержимое `.env`:**

```env
# DATABASE
DATABASE_URL="postgresql://nella:nella@postgres:5432/nella?schema=public"

# AUTH
AUTH_SECRET="nella-secret-key-change-this-in-production"
ADMIN_EMAIL="admin@nella.local"
ADMIN_PASSWORD="admin123"

# APP
NODE_ENV="production"
APP_URL="http://localhost:3000"
COOKIE_SECURE="false"

# EMAIL (MailHog для локальной разработки)
SMTP_HOST="mailhog"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM="info@nella.premium"
SMTP_FROM_NAME="Nella Premium"

# YOOKASSA (Платежи - тестовые данные)
YOOKASSA_SHOP_ID="123456"
YOOKASSA_SECRET_KEY="test_secret_key_12345"
YOOKASSA_RETURN_URL="http://localhost:3000/payment/success"
YOOKASSA_MODE="test"

# LOGISTICS (Опционально)
CDEK_API_KEY=""
CDEK_ACCOUNT="test"
OZON_API_KEY=""

# POSTGRES PASSWORD (если хочешь изменить)
POSTGRES_PASSWORD="nella"
```

### 3️⃣ Запусти Docker Compose

**Первый запуск (будет долгий, качает образы):**

```bash
docker compose up -d
```

**Флаг `-d` запускает в фоне.**

**Проверь статус контейнеров:**

```bash
docker compose ps
```

Должно показать:
```
NAME                 IMAGE                COMMAND             STATUS
nella-app            node:22-alpine       npm start           Up
nella-postgres       postgres:16-alpine   postgres            Up (healthy)
nella-mailhog        mailhog:latest       MailHog             Up
```

**Если контейнер app падает, проверь логи:**

```bash
docker compose logs nella-app
```

### 4️⃣ Дождись готовности приложения

Когда увидишь в логах:
```
✓ Ready in 178ms
- Local: http://localhost:3000
```

— приложение готово!

### 5️⃣ Открой в браузере

| Сервис | URL |
|--------|-----|
| 🛍️ Магазин | http://localhost:3000 |
| 👨‍💼 Админка | http://localhost:3000/admin |
| 📧 MailHog (письма) | http://localhost:8025 |

---

## 🔐 Первый вход в админку

**URL:** http://localhost:3000/admin/login

**Данные по умолчанию:**
- Email: `admin@nella.local`
- Пароль: `admin123`

⚠️ **Измени в продакшене!**

---

## 📧 Email система

### Локально (MailHog)

Все письма автоматически перехватываются и видны в веб-интерфейсе:

👉 http://localhost:8025

Ничего не нужно конфигурировать!

### Для продакшена (Mailtrap)

1. Зарегистрируйся на https://mailtrap.io (есть бесплатный план)
2. Получи SMTP учетные данные
3. Обнови `.env`:

```env
SMTP_HOST="live.smtp.mailtrap.io"
SMTP_PORT="587"
SMTP_USER="your_mailtrap_username"
SMTP_PASSWORD="your_mailtrap_password"
```

4. Перезагрузи контейнер:

```bash
docker compose restart nella-app
```

---

## 🛑 Управление контейнерами

### Остановить все

```bash
docker compose down
```

Данные БД **сохранятся** в volume `nella_postgres_data`.

### Полная очистка (удалит ВСЕ данные!)

```bash
docker compose down -v
```

### Перезагрузить

```bash
docker compose restart nella-app
```

### Посмотреть логи

```bash
# Все логи
docker compose logs

# Только app
docker compose logs nella-app

# Только БД
docker compose logs nella-postgres

# Следить в реал-тайме
docker compose logs -f nella-app
```

### Войти в контейнер (shell)

```bash
# Node.js контейнер
docker exec -it nella-app sh

# PostgreSQL контейнер
docker exec -it nella-postgres psql -U nella -d nella
```

---

## 🗄️ База данных

### Автоматически при запуске

- Создаётся БД `nella`
- Выполняются все миграции Prisma
- Загружаются тестовые данные (seed)

### Ручной доступ к БД

```bash
# Войти в psql
docker exec -it nella-postgres psql -U nella -d nella

# В psql:
\dt                    # Список таблиц
SELECT * FROM "User";  # Запрос
\q                     # Выход
```

### Перезалить тестовые данные

```bash
docker exec nella-app npx prisma db seed
```

---

## 🔧 Разработка

### Горячая перезагрузка (dev mode)

Docker Compose НЕ использует dev mode по умолчанию. Если хочешь:

**Отредактируй `docker-compose.yml`:**

```yaml
command: sh -c "npm ci && npm run db:generate && npm run dev"
```

Вместо `npm start`.

### Пересобрать приложение

```bash
docker compose build --no-cache nella-app
docker compose up -d nella-app
```

### Установить новый пакет

```bash
docker exec nella-app npm install <package-name>
```

---

## 🐛 Troubleshooting

### Контейнер app постоянно падает

**Проверь логи:**
```bash
docker compose logs nella-app
```

**Частые ошибки:**

1. **DATABASE_URL не задан** → добавь в `.env`
2. **PostgreSQL не готов** → дождись "healthy" статуса
3. **Port 3000 занят** → измени в `docker-compose.yml`: `"3001:3000"`

### Не могу подключиться к БД

```bash
# Проверь что postgres запущен
docker compose ps

# Проверь готовность (должна вернуть "accepting connections")
docker exec nella-postgres pg_isready -U nella
```

### Письма не отправляются

```bash
# Проверь что MailHog работает
docker compose ps nella-mailhog

# Открой http://localhost:8025
```

### Нужно очистить node_modules

```bash
docker compose down -v
rm -rf node_modules package-lock.json
docker compose up -d
```

---

## 📦 Docker Compose файл структура

**Файл:** `docker-compose.yml`

```yaml
services:
  postgres:          # PostgreSQL БД
    image: postgres:16-alpine
    ports: [5432:5432]
    healthcheck: enabled
    volumes: [data persistence]

  mailhog:           # Email catcher
    image: mailhog:latest
    ports: [1025, 8025]

  app:               # Next.js приложение
    image: node:22-alpine
    ports: [3000:3000]
    depends_on: [postgres, mailhog]
    command: npm start
    volumes: [source code mount]

volumes:
  nella_postgres_data: persist DB
```

---

## 🔄 Pipeline запуска

1. **docker compose up -d** ↓
2. Запускаются контейнеры в порядке dependencies ↓
3. postgres healthcheck → wait for ready ↓
4. mailhog starts ↓
5. app container starts ↓
6. npm ci (установка пакетов) ↓
7. npm run db:generate (Prisma client) ↓
8. npm run build (Next.js build) ↓
9. npm start (Production server) ↓
10. ✅ Доступно на http://localhost:3000

---

## 📝 Переменные окружения

| Переменная | Значение по умолчанию | Описание |
|------------|----------------------|---------|
| `DATABASE_URL` | - | **Обязательна** для подключения к БД |
| `AUTH_SECRET` | - | **Обязательна** для сессий |
| `ADMIN_EMAIL` | admin@nella.local | Email админа |
| `ADMIN_PASSWORD` | admin123 | Пароль админа |
| `NODE_ENV` | production | production или development |
| `SMTP_HOST` | mailhog | Host почтового сервера |
| `YOOKASSA_SHOP_ID` | - | ID магазина YooKassa |
| `YOOKASSA_SECRET_KEY` | - | Секретный ключ YooKassa |

---

## 🎯 Готово к использованию!

Теперь можешь:

✅ Создавать товары в админке  
✅ Добавлять в корзину и оформлять заказы  
✅ Смотреть письма в MailHog  
✅ Редактировать коллекции и скидки  

**Дальнейшие шаги:**

1. Заполни реальные SMTP credentials (Mailtrap)
2. Добавь YooKassa ключи для платежей
3. Интегрируй СДЭК/Озон для логистики
4. Раздели пароли админа в продакшене

---

## 📞 Дополнительно

**Документация проекта:** см. `README.md`

**API документация:** будет добавлена позже

**Issues:** создавай в GitHub если что-то сломалось!

