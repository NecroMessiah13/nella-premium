# Интеграция YooKassa — Nella Premium

## Статус интеграции

✅ **Готово к использованию!**

## Что работает

### 1. Создание платежей
- **Endpoint:** `GET /api/payments/create?orderId={id}`
- Автоматически создаёт платёж в YooKassa
- Перенаправляет пользователя на форму оплаты YooKassa
- Сохраняет payment ID в базу

### 2. Webhook для уведомлений
- **Endpoint:** `POST /api/payments/webhook`
- Обрабатывает события: `payment.succeeded`, `payment.failed`, `refund.succeeded`
- Автоматически обновляет статусы заказов
- Безопасен к повторным вызовам

### 3. Страницы результата
- **Успех:** `/payment/success` — показывает сообщение об успешном платеже
- **Обработка:** `/payment` — показывает статус обработки платежа

## Конфигурация

### Environment Variables (`.env`)
```
YOOKASSA_SHOP_ID=123456                           # ID магазина в YooKassa
YOOKASSA_SECRET_KEY=test_secret_key               # Секретный ключ
YOOKASSA_RETURN_URL=http://localhost:3000/payment/success  # URL для возврата
YOOKASSA_MODE=test                                # test или production
```

### Как получить реальные ключи YooKassa

1. Зайдите на https://yookassa.ru
2. Создайте аккаунт
3. Перейдите в "Мой профиль" → "API ключи"
4. Скопируйте Shop ID и Secret Key
5. Обновите `.env` файл

## Тестирование в локальном режиме

Сейчас используются тестовые данные YooKassa:
- **Shop ID:** `123456`
- **Secret Key:** `test_secret_key`
- **Mode:** `test`

При заказе платежный шлюз вернёт тестовую форму оплаты.

## Тестовые карты для YooKassa

Используйте эти карты для тестирования:

| Номер карты      | Статус           |
|------------------|------------------|
| 4111111111111111 | Успешный платёж  |
| 5555555555554444 | Успешный платёж  |
| 4242424242424242 | Отклонённый      |

**CVC:** любые 3 цифры  
**Дата:** любая будущая дата

## Поток оплаты

```
1. Пользователь заполняет форму на /checkout
2. Выбирает "Карта / Яндекс.Касса"
3. Нажимает "Создать заказ"
4. Создаётся заказ в БД с status=NEW, paymentStatus=PENDING
5. Redirect на /api/payments/create?orderId={id}
6. Создаётся платёж в YooKassa
7. Redirect на форму оплаты YooKassa
8. Пользователь вводит данные карты
9. YooKassa отправляет webhook на /api/payments/webhook
10. Заказ обновляется: status=PROCESSING, paymentStatus=PAID
11. Пользователь перенаправляется на /payment/success
```

## Webhook от YooKassa

YooKassa будет отправлять POST запросы на:
```
https://yourdomain.com/api/payments/webhook
```

### Обрабатываемые события

| Событие            | Действие                          |
|--------------------|-----------------------------------|
| payment.succeeded  | Обновляет status=PROCESSING, paymentStatus=PAID |
| payment.captured   | То же, что payment.succeeded      |
| payment.failed     | Обновляет paymentStatus=FAILED    |
| payment.canceled   | То же, что payment.failed         |
| refund.succeeded   | Обновляет status=CANCELLED, paymentStatus=REFUNDED |

## Переменные в Order

После создания платежа в заказе сохраняется:

```typescript
order.paymentId       // ID платежа в YooKassa
order.paymentStatus   // PENDING → PAID → FAILED / REFUNDED
order.status          // NEW → PROCESSING → SHIPPED → DELIVERED / CANCELLED
order.total           // Сумма с учётом доставки в копейках
order.deliveryMethod  // COURIER / PICKUP / MAIL
order.deliveryCost    // Стоимость доставки
```

## Что ещё нужно сделать

1. ✅ Создание платежей
2. ✅ Webhook для уведомлений
3. ✅ Обновление статусов заказов
4. ⏳ Email уведомления при оплате
5. ⏳ Интеграция с логистической системой для трекинга
6. ⏳ Возвраты и рефанды
7. ⏳ Подписки/рецидивирующие платежи

## Тестирование в production

1. Обновите `.env`:
```
YOOKASSA_SHOP_ID=ваш_реальный_id
YOOKASSA_SECRET_KEY=ваш_реальный_ключ
YOOKASSA_MODE=production
```

2. Добавьте webhook URL в админку YooKassa:
   - Перейдите в "Настройки" → "Webhooks"
   - Добавьте URL: `https://yourdomain.com/api/payments/webhook`
   - Тип события: "Платёж"

3. Начните принимать реальные платежи!

## Безопасность

- Все платежи проверяются на стороне YooKassa
- Order ID и Payment ID хранятся в БД
- Webhook безопасен к повторным вызовам (возвращает 200 всегда)
- Используется базовая HTTP аутентификация для API

## Поддержка

Документация YooKassa: https://yookassa.ru/developers
