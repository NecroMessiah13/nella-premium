# Быстрый старт — Email и Доставка

## Что добавилось?

### 📧 Email система
- ✅ Автоматические уведомления при заказе, оплате, отправке, доставке
- ✅ HTML шаблоны с красивым оформлением
- ✅ Поддержка всех SMTP провайдеров

### 📦 Логистика
- ✅ СДЭК API интеграция
- ✅ Озон Логистика интеграция
- ✅ Автогенерация трекинг-номеров
- ✅ Статусы доставки

---

## Тестирование локально

### 1. Запустить MailHog (для тестирования email)

```bash
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

Затем открыть: http://localhost:8025

### 2. Обновить .env

```
SMTP_HOST=localhost
SMTP_PORT=1025
```

### 3. Создать заказ

1. Открыть http://localhost:3000/checkout
2. Добавить товар, заполнить форму
3. Выбрать "При получении" (чтобы не идти на реальный платёж)
4. Нажать "Создать заказ"

### 4. Проверить email

- Email появится в MailHog: http://localhost:8025
- Должно быть письмо об оформлении заказа

---

## Production настройка

### Email

Выбрать провайдера (SendGrid, Mailgun, Yandex.Mail, и т.д.) и обновить .env:

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxx
SMTP_FROM=orders@nella.premium
SMTP_FROM_NAME=Nella Premium
```

### СДЭК

1. Зарегистрироваться: https://cdek.ru
2. Получить API ключи в админке
3. Обновить .env:

```
CDEK_API_KEY=your_key_here
CDEK_ACCOUNT=your_account
```

### Озон

1. Зарегистрироваться: https://ozonlogistics.com
2. Получить API ключ
3. Обновить .env:

```
OZON_API_KEY=your_key_here
```

---

## Использование в админке

(В разработке — добавление кнопки отправки заказов через логистов)

### Пока можно использовать API

#### Отправить заказ через СДЭК

```bash
curl -X POST http://localhost:3000/api/shipping/create \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1,
    "carrier": "CDEK"
  }'
```

#### Отправить email

```bash
curl -X POST http://localhost:3000/api/notifications/email \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1,
    "eventType": "SHIPPING_STARTED",
    "trackingNumber": "NEL-ABC123"
  }'
```

---

## Файлы которые добавились

```
lib/
├── email.ts              # Email система + шаблоны
├── cdek.ts              # СДЭК API
└── ozon.ts              # Озон API

app/api/
├── notifications/email/route.ts   # Email endpoint
├── shipping/create/route.ts        # Доставка endpoint
└── payments/webhook/route.ts       # Обновлён для email

docs/
├── EMAIL_AND_LOGISTICS.md    # Полная документация
└── YOOKASSA_TESTING.md       # Был раньше
```

---

## События и их email

| Событие | Когда | Email |
|---------|-------|-------|
| ORDER_CONFIRMED | Сразу после создания | Подтверждение с деталями |
| PAYMENT_CONFIRMED | После успешной оплаты | Начало обработки |
| SHIPPING_STARTED | При отправке | Трекинг-номер |
| DELIVERY_CONFIRMED | При доставке | Спасибо + инструкция возврата |

---

## Что ещё нужно сделать

- [ ] Добавить кнопку "Отправить" в админке
- [ ] Интеграция с почтоматами Яндекс.Go
- [ ] Webhook'и от логистических партнёров
- [ ] SMS уведомления
- [ ] Страница отслеживания для клиента
- [ ] Рефанды и возвраты

---

## Вопросы?

Всё работает! Дальше можно:
1. Подключить реальные email провайдеры
2. Получить API ключи у СДЭК/Озона
3. Добавить кнопки в админку
4. Добавить API для отслеживания на сайте

