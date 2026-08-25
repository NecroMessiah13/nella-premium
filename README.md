# Nella Premium — Fullstack

Next.js + PostgreSQL + Prisma. Каталог, товары, варианты размеров/цветов, остатки и заказы хранятся в PostgreSQL. Backend реализован через Next.js Route Handlers.

## Запуск Windows
1. Установить Node.js 20+ и Docker Desktop.
2. В папке проекта создать `.env` из `.env.example`.
3. Выполнить:

```powershell
docker compose up -d
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Открыть http://localhost:3000

## База данных
`npm run db:studio` — визуальное управление PostgreSQL через Prisma Studio.

## API
GET /api/products
GET /api/products/[slug]
GET /api/categories
POST /api/products
POST /api/orders
GET /api/orders/[id]

Создание заказа проверяет остаток варианта и уменьшает stock внутри транзакции PostgreSQL.

Оплата, авторизация, защищённая админка, доставка и загрузка реальных фото — следующий этап.

## Авторизация
Админка защищена серверной HttpOnly-сессией. Учетка создается из ADMIN_EMAIL/ADMIN_PASSWORD при первом входе.

## ЮKassa
Платеж создается только на сервере через официальный API ЮKassa. Заполните YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY и YOOKASSA_RETURN_URL. Webhook: `/api/payments/webhook`. Для реальных платежей сначала подключите магазин и договор в ЮKassa; тестовый магазин можно использовать до этого.


## Что добавлено в этой сборке
- Защита всех admin API серверной сессией.
- Выход из админки.
- Управление товарами, ссылками на фото и остатками по вариантам.
- В заказах отображается статус оплаты.
- ЮKassa: создание платежа на сервере и webhook для статуса.
- Перед production обязательно включить HTTPS и настроить webhook на публичном домене.


### Важно для production
Webhook ЮKassa должен быть доступен по HTTPS на публичном домене. ЮKassa рекомендует после получения уведомления дополнительно проверить актуальный статус объекта через API; это реализовано в этой сборке.

## Быстрый запуск новой сборки

1. Установите Node.js 20+ и Docker Desktop.
2. Скопируйте `.env.example` в `.env`.
3. Задайте `ADMIN_EMAIL`, `ADMIN_PASSWORD` и длинный случайный `AUTH_SECRET`.
4. Запустите PostgreSQL:

```bash
docker compose up -d
```

5. Установите зависимости:

```bash
npm install
```

6. Создайте Prisma Client и примените схему:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

7. Запустите:

```bash
npm run dev
```

Откройте `http://localhost:3000`.

Админка: `http://localhost:3000/admin/login`.

## Настройка ЮKassa

В `.env` укажите `YOOKASSA_SHOP_ID` и `YOOKASSA_SECRET_KEY`. Все запросы к ЮKassa выполняются сервером; секретный ключ не попадает в браузер.

Для теста можно использовать тестовый магазин ЮKassa. Для боевого магазина потребуется подключение магазина и HTTPS.

Webhook:

`https://ВАШ-ДОМЕН/api/payments/webhook`

В личном кабинете ЮKassa включите уведомления о событиях платежей. Сервер webhook дополнительно запрашивает актуальный объект платежа у ЮKassa перед изменением заказа.

## Что умеет админка

- авторизация администратора;
- выход из админки;
- каталог товаров;
- создание/редактирование/удаление товара;
- ссылки на несколько фотографий;
- остатки по размерам и цветам;
- источник и ссылка на исходную карточку;
- просмотр заказов;
- изменение статуса заказа;
- отображение статуса оплаты ЮKassa.

Для production хранить изображения лучше в S3-совместимом object storage, а не в файловой системе приложения. Текущая версия использует URL фотографий, чтобы не привязывать магазин к конкретному хранилищу.
