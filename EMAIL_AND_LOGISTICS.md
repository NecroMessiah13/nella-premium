# Email Уведомления и Логистика — Nella Premium

## ✅ Статус реализации

- [x] Email уведомления при оформлении заказа
- [x] Email при успешной оплате
- [x] Email с трекинг-номером при отправке
- [x] Email при доставке
- [x] Интеграция с СДЭК (API)
- [x] Интеграция с Озон Логистика (API)
- [x] Генерация трекинг-номеров
- [x] API для управления доставкой
- [ ] Админка: кнопка отправки заказов (в разработке)
- [ ] Почтоматы Яндекс.Go (в разработке)

---

## Email Уведомления

### Конфигурация SMTP

В `.env`:
```
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=info@nella.premium
SMTP_FROM_NAME=Nella Premium
```

### Типы уведомлений

#### 1. Подтверждение заказа (`ORDER_CONFIRMED`)
- **Когда:** при создании заказа
- **Содержит:** список товаров, сумму, адрес доставки
- **Кому:** покупателю

#### 2. Подтверждение платежа (`PAYMENT_CONFIRMED`)
- **Когда:** после успешной оплаты через YooKassa
- **Содержит:** информацию о начале обработки
- **Кому:** покупателю

#### 3. Уведомление об отправке (`SHIPPING_STARTED`)
- **Когда:** при создании отправки через логистического партнёра
- **Содержит:** трекинг-номер и примерную дату доставки
- **Кому:** покупателю

#### 4. Подтверждение доставки (`DELIVERY_CONFIRMED`)
- **Когда:** при смене статуса на DELIVERED
- **Содержит:** инструкции по возврату и отзывам
- **Кому:** покупателю

### Отправка email вручную

```bash
curl -X POST http://localhost:3000/api/notifications/email \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1,
    "eventType": "ORDER_CONFIRMED"
  }'
```

---

## Логистические партнёры

### СДЭК (СДЭКтрон)

**API документация:** https://api.cdek.ru/v2

#### Конфигурация

В `.env`:
```
CDEK_API_KEY=your_api_key
CDEK_ACCOUNT=test
```

#### Возможности

- Создание заказов на доставку
- Расчёт стоимости доставки
- Получение статусов доставки
- Работа с городами и ПВЗ

#### Использование

```typescript
import { createCDEKOrder } from '@/lib/cdek';

const result = await createCDEKOrder(orderId, order);
console.log(result.trackingNumber); // NEL-...
```

#### Тарифы СДЭК (код 137 — Экспресс)
- **Вес:** до 20 кг
- **Сроки:** 1-5 дней в зависимости от города
- **Стоимость:** рассчитывается по API

---

### Озон Логистика

**API документация:** https://api.ozonlogistics.com

#### Конфигурация

В `.env`:
```
OZON_API_KEY=your_api_key
```

#### Возможности

- Создание отправок
- Получение ПВЗ (пункты выдачи)
- Расчёт доставки
- Отслеживание

#### Использование

```typescript
import { createOzonShipment } from '@/lib/ozon';

const result = await createOzonShipment(orderId, order);
console.log(result.trackingNumber);
```

---

### Почтоматы (в разработке)

Планируется интеграция с:
- **Яндекс.Маршрутизация** для поиска ближайших почтоматов
- **Яндекс.Go** для доставки в почтоматы
- Отправка SMS/email с кодом доступа

---

## Workflow доставки

```
1. Заказ создан (PROCESSING) → ORDER_CONFIRMED email
2. Платёж прошёл → PAYMENT_CONFIRMED email
3. Админ нажимает "Отправить" → /api/shipping/create
4. Заказ отправлен через партнёра → SHIPPED + email с трекингом
5. Партнёр доставил → DELIVERED (webhook от партнёра)
6. Админ подтверждает → DELIVERY_CONFIRMED email
```

---

## API Endpoints

### Создание отправки

```
POST /api/shipping/create
```

Body:
```json
{
  "orderId": 123,
  "carrier": "CDEK|OZON|COURIER"
}
```

Response:
```json
{
  "success": true,
  "orderId": 123,
  "trackingNumber": "NEL-ABC123",
  "carrier": "CDEK",
  "carrierData": {...}
}
```

### Получение статуса доставки

```
GET /api/shipping/create?orderId=123
```

Response:
```json
{
  "orderId": 123,
  "status": "SHIPPED",
  "trackingNumber": "NEL-ABC123",
  "deliveryMethod": "COURIER",
  "deliveryCost": 0,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Отправка email

```
POST /api/notifications/email
```

Body:
```json
{
  "orderId": 123,
  "eventType": "SHIPPING_STARTED",
  "trackingNumber": "NEL-ABC123"
}
```

---

## Тестирование email в локальном режиме

### MailHog (рекомендуется)

1. Запустите MailHog:
```bash
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

2. Обновите `.env`:
```
SMTP_HOST=localhost
SMTP_PORT=1025
```

3. Откройте UI: http://localhost:8025
4. Все отправленные email появятся там

---

## Что делать дальше

### Шаг 1: Настроить email
- [ ] Выбрать SMTP провайдера (SendGrid, Mailgun, Yandex.Mail, и т.д.)
- [ ] Обновить `.env` с реальными параметрами
- [ ] Протестировать отправку

### Шаг 2: Подключить СДЭК
- [ ] Зарегистрироваться на https://cdek.ru
- [ ] Получить API ключи
- [ ] Обновить `.env`
- [ ] Протестировать создание заказа

### Шаг 3: Подключить Озон Логистику
- [ ] Зарегистрироваться на https://ozonlogistics.com
- [ ] Получить API ключи
- [ ] Обновить `.env`

### Шаг 4: Добавить кнопку в админку
- [ ] Кнопка "Отправить через СДЭК"
- [ ] Кнопка "Отправить через Озон"
- [ ] Выбор пункта выдачи для покупателя

### Шаг 5: Интеграция почтоматов
- [ ] API Яндекс.Go
- [ ] Поиск ближайших локаций
- [ ] SMS код доступа

---

## Примеры использования

### Отправить заказ через СДЭК

```typescript
const response = await fetch('/api/shipping/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: order.id,
    carrier: 'CDEK'
  })
});

const data = await response.json();
console.log(`Tracking: ${data.trackingNumber}`);
```

### Отправить email уведомление

```typescript
await fetch('/api/notifications/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: 123,
    eventType: 'SHIPPING_STARTED',
    trackingNumber: 'NEL-ABC123'
  })
});
```

---

## Советы

1. **Кэширование токенов:** CDEK токены кэшируются и переиспользуются
2. **Fallback:** если логистический API недоступен, используется обычный трекинг-номер
3. **Email рассылка:** используется Nodemailer для совместимости со всеми SMTP провайдерами
4. **Парсинг адресов:** адреса парсятся простым методом — можно улучшить через сервисы геокодирования

---

## Контакты поддержки

- СДЭК: https://cdek.ru/support
- Озон: https://ozonlogistics.com/support
- Yandex.Go: https://go.yandex.ru

