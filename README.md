# Nella Premium - Структура проекта

## 📋 Обзор

**Nella Premium** — полнофункциональная e-commerce платформа для продажи женской одежды, построенная на Next.js с PostgreSQL и Prisma ORM.

**Стек:**
- Frontend: Next.js 16, React, TypeScript
- Backend: Next.js API Routes
- БД: PostgreSQL 16
- ORM: Prisma
- Email: Nodemailer + MailHog (локально) / Mailtrap (продакшн)
- Платежи: YooKassa
- Логистика: СДЭК, Озон Логистика

---

## 🏗️ Архитектура проекта

```
nella-fullstack/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Главная страница с товарами
│   ├── layout.tsx               # Root layout + стили
│   ├── globals.css              # Все стили (один файл)
│   │
│   ├── product/[slug]/          # Страница товара
│   │   └── page.tsx
│   │
│   ├── catalog/                 # Каталог товаров
│   │   └── page.tsx
│   │
│   ├── cart/                    # Корзина
│   │   └── page.tsx
│   │
│   ├── checkout/                # Оформление заказа
│   │   └── page.tsx
│   │
│   ├── payment/                 # Статус платежа
│   │   ├── page.tsx
│   │   └── success/
│   │       └── page.tsx
│   │
│   ├── admin/                   # Админ-панель
│   │   ├── page.tsx            # Управление товарами, коллекциями, скидками, заказами
│   │   └── login/
│   │       └── page.tsx         # Вход в админку
│   │
│   └── api/                     # API endpoints
│       ├── admin/
│       │   ├── products/        # Управление товарами
│       │   │   ├── route.ts     # GET (список), POST (создать)
│       │   │   └── [id]/
│       │   │       └── route.ts # GET, PUT (обновить), DELETE
│       │   │
│       │   ├── collections/     # Управление коллекциями
│       │   │   ├── route.ts
│       │   │   └── [id]/
│       │   │       └── route.ts
│       │   │
│       │   ├── discounts/       # Управление скидками
│       │   │   ├── route.ts
│       │   │   └── [id]/
│       │   │       └── route.ts
│       │   │
│       │   ├── orders/          # Управление заказами
│       │   │   ├── route.ts
│       │   │   └── [id]/
│       │   │       └── route.ts
│       │   │
│       │   └── upload/          # Загрузка фото
│       │       └── route.ts
│       │
│       ├── auth/
│       │   ├── login/           # Логин в админку
│       │   ├── logout/
│       │   └── me/              # Текущий пользователь
│       │
│       ├── products/            # Публичный API товаров
│       │   ├── route.ts         # GET список
│       │   └── [slug]/
│       │       ├── route.ts     # GET товар по slug
│       │       └── reviews/
│       │           └── route.ts # Отзывы о товаре
│       │
│       ├── categories/          # Категории товаров
│       │   └── route.ts
│       │
│       ├── orders/              # Создание заказа
│       │   ├── route.ts         # POST создать заказ
│       │   └── [id]/
│       │       └── route.ts     # GET информация о заказе
│       │
│       ├── payments/            # YooKassa интеграция
│       │   ├── create/
│       │   │   └── route.ts     # POST создать платёж
│       │   └── webhook/
│       │       └── route.ts     # POST вебхук платежа
│       │
│       ├── shipping/            # Логистика
│       │   ├── create/
│       │   │   └── route.ts     # POST отправка через СДЭК/Озон
│       │
│       ├── wishlist/            # Избранное
│       │   └── route.ts         # GET, POST, DELETE
│       │
│       ├── notifications/       # Отправка уведомлений
│       │   └── email/
│       │       └── route.ts     # POST отправить email
│       │
│       ├── bonus/               # Система бонусов
│       │   └── route.ts         # GET баланс, POST списать
│       │
│       └── categories/
│           └── route.ts         # GET категории
│
├── components/
│   ├── Header.tsx              # Навигация + иконки
│   ├── Icons.tsx               # SVG иконки (поиск, сердце, корзина)
│   ├── Cart.tsx                # Context для корзины
│   ├── CartDrawer.tsx          # Боковая панель корзины
│   └── ProductCard.tsx         # Карточка товара с модалью размеров
│
├── lib/
│   ├── prisma.ts               # Singleton PrismaClient
│   ├── auth.ts                 # Авторизация админа
│   ├── email.ts                # Шаблоны email + Nodemailer конфиг
│   ├── cdek.ts                 # СДЭК API интеграция
│   ├── ozon.ts                 # Озон Логистика API
│   ├── yookassa.ts             # YooKassa утилиты
│   └── products.ts             # Type definitions
│
├── prisma/
│   ├── schema.prisma           # БД схема (12 моделей)
│   ├── seed.ts                 # Тестовые данные + админ
│   └── migrations/             # История миграций
│
├── public/                     # Статические файлы
│
├── docker-compose.yml          # Контейнеры: App, PostgreSQL, MailHog
├── Dockerfile                  # Node.js образ
├── .env                        # Переменные окружения
├── .dockerignore
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

## 🗄️ База данных

### Модели Prisma (12 штук)

#### 👥 Пользователи & Сессии
```
User (Администраторы)
├── id, email, passwordHash, role (ADMIN/USER)
├── sessions: Session[]
└── wishlists, reviews, productViews: [...]

Session
├── id, userId, expiresAt
└── user: User

Wishlist (Избранное)
├── id, userId, productId
├── user: User
└── product: Product
```

#### 📦 Товары & Каталог
```
Category
├── id, name, slug
└── products: Product[]

Product
├── id, slug, name, description, price
├── color, tone (оттенок карточки), badge
├── rating, reviewCount
├── categoryId: Category
├── images: ProductImage[]
├── variants: ProductVariant[]
├── collections: CollectionProduct[]
└── discount: Discount?

ProductImage
├── id, url, alt, sortOrder
└── productId: Product

ProductVariant (Размеры)
├── id, sku, size (XS-XL), color, stock
└── productId: Product

ProductView (История просмотров)
├── id, userId, productId, viewedAt
├── user: User
└── product: Product

Review (Отзывы)
├── id, userId, productId, rating (1-5), comment
├── user: User
└── product: Product
```

#### 🛍️ Коллекции
```
Collection
├── id, name, slug, description, image
├── sortOrder, active (boolean)
├── products: CollectionProduct[]
└── discount: Discount?

CollectionProduct (Связь товаров и коллекций)
├── id, collectionId, productId
├── collection: Collection
└── product: Product
```

#### 💰 Скидки
```
Discount (Скидки на товары/коллекции)
├── id, code (уникальный), description
├── type (PERCENT/FIXED), value
├── maxUses, usedCount, active
├── productId?, collectionId?
├── startsAt, expiresAt (даты действия)
├── product?: Product
└── collection?: Collection

DiscountCode (Прромокоды)
├── id, code, description, type, value
├── maxUses, usedCount, active
└── startsAt, expiresAt
```

#### 📋 Заказы
```
Order
├── id, customerName, email, phone, address
├── status: OrderStatus (NEW, PROCESSING, SHIPPED, DELIVERED, COMPLETED, CANCELLED)
├── paymentStatus: PaymentStatus (PENDING, PAID, FAILED, REFUNDED, CANCELLED)
├── paymentId (YooKassa), trackingNumber (логистика)
├── total, deliveryMethod (COURIER, PICKUP, MAIL), deliveryCost
├── bonusEarned
├── items: OrderItem[]
├── createdAt, updatedAt

OrderItem
├── id, orderId, productId
├── name, price, size, color, quantity
└── order: Order
```

---

## 🎨 Фронтенд

### Страницы

| Страница | Маршрут | Описание |
|----------|---------|---------|
| Главная | `/` | Товары сетка 4 колонки, sticky header |
| Товар | `/product/[slug]` | Галерея, описание, отзывы, кнопка в корзину |
| Каталог | `/catalog` | Все товары, фильтры (в процессе) |
| Корзина | `/cart` | Список товаров, редактирование кол-ва |
| Оформление | `/checkout` | Форма доставки, платёжная информация |
| Платёж | `/payment` | Перенаправление на YooKassa |
| Успех | `/payment/success` | Подтверждение оказа |
| Админка | `/admin` | 4 вкладки: товары, коллекции, скидки, заказы |
| Логин | `/admin/login` | Вход в админку |

### Компоненты

**Header.tsx** — Шапка с логотипом, меню, иконками:
- Поиск (иконка 🔍)
- Избранное (иконка ♡)
- Корзина (иконка 🛒 с счётчиком)
- Мобильное меню (☰)

**ProductCard.tsx** — Карточка товара:
- Изображение с бейджем
- Название, цена, цвет
- Кнопка "Быстро добавить"
- Модаль выбора размера при клике

**CartDrawer.tsx** — Боковая панель корзины:
- Список товаров с изображениями
- Кнопка "Оформить"
- Кнопка закрытия (✕)

**Cart.tsx** — Context Provider для управления корзиной:
- State: товары, сумма
- Методы: addToCart, removeFromCart, updateQuantity
- Сохранение в localStorage

### Стили (globals.css)

Один файл со ВСЕМИ стилями (~8KB минифицированный):
- **Переменные**: цвета (`--bg`, `--ink`, `--accent`), шрифты
- **Компоненты**: header, cards, forms, buttons
- **Брейкпоинты**: 1024px (планшет), 900px (мобайл), 640px, 480px
- **Грид**: 4 колонки → 2 → 1 на маленьких экранах

---

## 🔧 API

### Публичные endpoints

```
GET  /api/products              # Все товары
GET  /api/products/[slug]       # Один товар
GET  /api/products/[slug]/reviews
POST /api/products/[slug]/reviews # Добавить отзыв

GET  /api/categories            # Категории

GET  /api/orders/[id]           # Данные заказа
POST /api/orders                # Создать заказ + отправить email

POST /api/payments/create       # Создать платёж YooKassa
POST /api/payments/webhook      # Вебхук YooKassa

POST /api/shipping/create       # Отправить через СДЭК/Озон

GET  /api/wishlist              # Избранное
POST /api/wishlist              # Добавить в избранное
DELETE /api/wishlist/[id]       # Удалить из избранного

POST /api/notifications/email   # Отправить email вручную
```

### Админские endpoints (требуют авторизации)

```
AUTH
POST /api/auth/login            # Логин (email + пароль)
POST /api/auth/logout           # Выход
GET  /api/auth/me               # Текущий админ

ТОВАРЫ
GET  /api/admin/products        # Список всех товаров
POST /api/admin/products        # Создать товар
PUT  /api/admin/products/[id]   # Обновить товар
DELETE /api/admin/products/[id] # Удалить товар

КОЛЛЕКЦИИ
GET  /api/admin/collections     # Список коллекций
POST /api/admin/collections     # Создать коллекцию
PUT  /api/admin/collections/[id]# Обновить коллекцию
DELETE /api/admin/collections/[id]

СКИДКИ
GET  /api/admin/discounts       # Список скидок
POST /api/admin/discounts       # Создать скидку
PUT  /api/admin/discounts/[id]  # Обновить скидку
DELETE /api/admin/discounts/[id]

ЗАКАЗЫ
GET  /api/admin/orders          # Список заказов
GET  /api/admin/orders/[id]     # Один заказ
PUT  /api/admin/orders/[id]     # Обновить статус

ЗАГРУЗКА
POST /api/admin/upload          # Загрузить фото
```

---

## 🚀 Запуск

### Локально с Docker

```bash
# Запустить все контейнеры
docker compose up -d

# Проверить статус
docker ps

# Логи
docker logs nella-app
docker logs nella-postgres
docker logs nella-mailhog
```

### URLs

| Сервис | URL |
|--------|-----|
| Главный сайт | http://localhost:3000 |
| Админка | http://localhost:3000/admin |
| MailHog (письма) | http://localhost:8025 |
| PostgreSQL | localhost:5432 |

### Учётные данные

**Админ:**
- Email: `admin@nella.local`
- Пароль: `admin123`

**БД:**
- Пользователь: `nella`
- Пароль: (из .env)

---

## 📧 Email система

### Шаблоны (4 типа)

1. **Order Confirmation** — После создания заказа
2. **Payment Confirmation** — После успешного платежа
3. **Shipping Notification** — После отправки (с tracking number)
4. **Delivery Confirmation** — После доставки

### Конфигурация

**Локально:** MailHog (http://localhost:8025) — письма видны в веб-интерфейсе

**Продакшн:** Mailtrap (обновить `.env`):
```
SMTP_HOST=live.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_username
SMTP_PASSWORD=your_password
```

---

## 💳 Интеграции

### YooKassa (Платежи)

- Тестовый режим (demo shop ID)
- Две системы: Card + Cash on Delivery
- Webhook для обновления статуса заказа

**Конфиг (.env):**
```
YOOKASSA_SHOP_ID=123456
YOOKASSA_SECRET_KEY=test_secret_key
```

### СДЭК (Логистика)

- Создание заказа в системе
- Получение tracking number
- Отправка уведомления с ссылкой

### Озон Логистика

- Альтернативный способ доставки
- Интеграция аналогична СДЭК

---

## 🔐 Авторизация

### Админ

- Сессия в cookies (httpOnly, 7 дней)
- Проверка роли: `requireAdmin()`
- Все API endpoints защищены

### Клиент

- Пока нет системы登входа
- TODO: Реализовать аккаунты пользователей

---

## 📝 Тестовые данные

### Товары (8 шт.)

Все загружаются через `seed.ts` при запуске:

| Товар | Цена | Остаток | Фото |
|-------|------|---------|------|
| Платье LINEN 01 | 12,900₽ | 8-35 | 3 |
| Рубашка COTTON 02 | 7,900₽ | 8-35 | 3 |
| Брюки STRAIGHT 03 | 8,900₽ | 8-35 | 3 |
| Платье SILK 01 | 13,900₽ | 8-35 | 3 |
| Костюм BASIC 01 | 15,900₽ | 8-35 | 3 |
| Футболка FIT 01 | 3,900₽ | 8-35 | 3 |
| Жакет SOFT 01 | 14,900₽ | 8-35 | 3 |
| Платье MIDI 02 | 11,900₽ | 8-35 | 3 |

### Коллекции (3 шт.)

- Новые поступления (3 товара)
- Платья (3 товара)
- Базовые вещи (2 товара)

### Скидки (3 шт.)

- `DRESSES15` — 15% на платья (до конца года)
- `FIRST300` — 300₽ на первый заказ (до марта)
- `LINEN20` — 20% на платье LINEN 01 (30 дней)

---

## 📱 Адаптивность

**Брейкпоинты:**
- `1024px` — Планшеты (3 колонки)
- `900px` — Мобайл (2 колонки)
- `640px` — Маленький мобайл (2 колонки, меньше паддинги)
- `480px` — Очень маленький (1 колонка)

**Оптимизация:**
- SVG иконки вместо текста
- Touch-friendly кнопки (48px)
- Sticky header на всех устройствах
- Полноэкранный модальной для выбора размера

---

## 🔜 TODO

### Высокий приоритет
- [ ] Фильтры каталога (цена, размер, цвет)
- [ ] Пагинация товаров
- [ ] История просмотренных товаров
- [ ] Применение кодов скидок в checkout
- [ ] Система аккаунтов пользователей

### Средний приоритет
- [ ] Баннеры на главной
- [ ] Страницы коллекций
- [ ] FAQ раздел
- [ ] Live chat поддержка

### Низкий приоритет
- [ ] Система бонусов (уже в БД)
- [ ] Newsletter
- [ ] Blog
- [ ] Расширенная аналитика

---

## 📞 Контакты

**Проект:** Nella Premium — e-commerce платформа  
**Стек:** Next.js, PostgreSQL, Prisma, TypeScript  
**Развёртывание:** Docker Compose

