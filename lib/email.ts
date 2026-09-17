import nodemailer from 'nodemailer';

// Конфигурация email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT || '1025'),
  secure: false,
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      }
    : undefined,
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const fromName = process.env.SMTP_FROM_NAME || 'Nella Premium';
    const fromEmail = process.env.SMTP_FROM;
    if (!fromEmail) {
      throw new Error('SMTP_FROM is not configured');
    }

    const result = await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log('Email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

// Email шаблоны
export const emailTemplates = {
  orderConfirmation: (order: any) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1c1b19; color: #fff; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-info { background: #fff; padding: 15px; margin: 15px 0; border: 1px solid #ddd; border-radius: 4px; }
        .order-info p { margin: 8px 0; }
        .label { font-weight: bold; color: #666; }
        .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .items-table th { background: #f0f0f0; padding: 10px; text-align: left; }
        .items-table td { padding: 10px; border-bottom: 1px solid #ddd; }
        .total { font-size: 18px; font-weight: bold; color: #1c1b19; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 20px; background: #1c1b19; color: #fff; text-decoration: none; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Заказ успешно принят!</h1>
        </div>
        
        <div class="content">
          <p>Спасибо за ваш заказ, <strong>${order.customerName}</strong>!</p>
          
          <div class="order-info">
            <p><span class="label">Номер заказа:</span> #${order.id}</p>
            <p><span class="label">Дата:</span> ${new Date(order.createdAt).toLocaleString('ru-RU')}</p>
            <p><span class="label">Email:</span> ${order.email}</p>
          </div>

          <h3>Товары в заказе</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Товар</th>
                <th>Размер</th>
                <th>Кол-во</th>
                <th>Цена</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                .map(
                  (item: any) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.size}</td>
                  <td>${item.quantity}</td>
                  <td>${(item.price / 100).toFixed(2)} ₽</td>
                  <td><strong>${((item.price * item.quantity) / 100).toFixed(2)} ₽</strong></td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="order-info">
            <p><span class="label">Способ доставки:</span> ${getDeliveryName(order.deliveryMethod)}</p>
            ${
              order.deliveryCost > 0
                ? `<p><span class="label">Стоимость доставки:</span> ${(order.deliveryCost / 100).toFixed(2)} ₽</p>`
                : ''
            }
            ${
              order.discountAmount > 0
                ? `<p><span class="label">Скидка:</span> <strong style="color:#2e7d32">−${(order.discountAmount / 100).toFixed(2)} ₽</strong>${order.promoCode ? ` (${order.promoCode})` : ''}</p>`
                : ''
            }
            <p class="total">Итого: ${(order.total / 100).toFixed(2)} ₽</p>
          </div>

          <div class="order-info">
            <p><span class="label">Адрес доставки:</span></p>
            <p>${order.address || 'Будет уточнен после выбора способа доставки'}</p>
          </div>

          <p style="margin-top: 20px;">
            <a href="${process.env.APP_URL}/orders/${order.id}?guest=${order.guestId || ''}" class="button">Отследить заказ</a>
          </p>

          <p>Если у вас есть вопросы, напишите нам: support@nella.premium</p>
        </div>

        <div class="footer">
          <p>Nella Premium — платформа женской моды</p>
          <p>© ${new Date().getFullYear()} Все права защищены</p>
        </div>
      </div>
    </body>
    </html>
  `,

  paymentConfirmation: (order: any) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: #fff; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; background: #f9f9f9; }
        .success-badge { display: inline-block; background: #10b981; color: #fff; padding: 10px 15px; border-radius: 4px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Платёж успешно принят!</h1>
        </div>
        
        <div class="content">
          <p>Спасибо, <strong>${order.customerName}</strong>!</p>
          
          <p>Ваш платёж успешно обработан. Заказ подготавливается к отправке.</p>
          
          <div class="success-badge">
            Заказ #${order.id} — статус: ОБРАБОТКА
          </div>

          <h3>Что дальше?</h3>
          <ul>
            <li>Товары упаковываются на складе (1-2 дня)</li>
            <li>Отправляются курьером или выбранным способом</li>
            <li>Вы получите трекинг-номер в отдельном письме</li>
            <li>Доставка: ${getDeliveryDays(order.deliveryMethod)} рабочих дней</li>
          </ul>

          <p style="margin-top: 20px;">
            <a href="${process.env.APP_URL}/orders/${order.id}?guest=${order.guestId || ''}" style="display: inline-block; padding: 12px 20px; background: #10b981; color: #fff; text-decoration: none; border-radius: 4px;">Отследить заказ</a>
          </p>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Если у вас есть вопросы, напишите нам: support@nella.premium<br>
            Горячая линия: +7 (999) XXX-XX-XX
          </p>
        </div>

        <div class="footer">
          <p>Nella Premium — платформа женской моды</p>
          <p>© ${new Date().getFullYear()} Все права защищены</p>
        </div>
      </div>
    </body>
    </html>
  `,

  shippingNotification: (order: any, trackingNumber: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: #fff; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; background: #f9f9f9; }
        .tracking { background: #fff; padding: 20px; border: 2px solid #3b82f6; border-radius: 4px; margin: 20px 0; text-align: center; }
        .tracking .label { color: #666; font-size: 12px; }
        .tracking .number { font-size: 24px; font-weight: bold; color: #3b82f6; margin: 10px 0; font-family: monospace; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Заказ в пути!</h1>
        </div>
        
        <div class="content">
          <p>Привет, <strong>${order.customerName}</strong>!</p>
          
          <p>Ваш заказ отправлен и уже в пути. Вы можете отследить доставку по трекинг-номеру:</p>
          
          <div class="tracking">
            <p class="label">Трекинг-номер</p>
            <p class="number">${trackingNumber}</p>
            <p style="color: #666; font-size: 12px;">Скопируйте этот номер для отслеживания</p>
          </div>

          <h3>Информация о доставке</h3>
          <ul>
            <li><strong>Метод:</strong> ${getDeliveryName(order.deliveryMethod)}</li>
            <li><strong>Ожидаемая доставка:</strong> ${getExpectedDeliveryDate(order.deliveryMethod)}</li>
            <li><strong>Адрес:</strong> ${order.address}</li>
          </ul>

          <p style="background: #fffbea; padding: 15px; border-radius: 4px; border-left: 4px solid #f59e0b;">
            <strong>💡 Совет:</strong> Сохраните трекинг-номер. Вы сможете его использовать на сайте доставщика для отслеживания посылки в реальном времени.
          </p>

          <p style="margin-top: 20px;">
            <a href="${process.env.APP_URL}/orders/${order.id}?guest=${order.guestId || ''}" style="display: inline-block; padding: 12px 20px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 4px;">Статус доставки</a>
          </p>
        </div>

        <div class="footer">
          <p>Nella Premium — платформа женской моды</p>
          <p>© ${new Date().getFullYear()} Все права защищены</p>
        </div>
      </div>
    </body>
    </html>
  `,

  deliveryConfirmation: (order: any) => {
    const isPickup = order.deliveryMethod === 'PICKUP';
    const headline = isPickup ? '📦 Товар на пункте выдачи!' : '✓ Заказ доставлен!';
    const sub = isPickup
      ? `Ваш заказ #${order.id} прибыл на пункт выдачи и ожидает вас.`
      : `Ваш заказ #${order.id} успешно доставлен!`;
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: #fff; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${headline}</h1>
        </div>
        
        <div class="content">
          <p>Спасибо за покупку, <strong>${order.customerName}</strong>!</p>
          
          <p>${sub}</p>

          <h3>Следующие шаги</h3>
          <ul>
            ${
              isPickup
                ? `<li>Заберите заказ в пункте выдачи в течение рабочих часов</li><li>Возьмите с собой паспорт или код подтверждения</li>`
                : `<li>Проверьте целостность посылки</li>`
            }
            <li>Примерьте товары в течение 14 дней</li>
            <li>Если что-то не подходит, вы можете вернуть товар</li>
            <li>Оставьте отзыв о товарах и нашем сервисе</li>
          </ul>

          <p style="background: #ecfdf5; padding: 15px; border-radius: 4px; border-left: 4px solid #10b981;">
            <strong>ℹ️ Важно:</strong> У вас есть 14 дней с момента доставки на возврат. Товар должен быть в первоначальном состоянии.
          </p>

          <p style="margin-top: 20px;">
            <a href="${process.env.APP_URL}/orders/${order.id}?guest=${order.guestId || ''}" style="display: inline-block; padding: 12px 20px; background: #10b981; color: #fff; text-decoration: none; border-radius: 4px;">Статус заказа</a>
          </p>

          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            Если у вас есть вопросы: support@nella.premium<br>
            Горячая линия: +7 (999) XXX-XX-XX
          </p>
        </div>

        <div class="footer">
          <p>Nella Premium — платформа женской моды</p>
          <p>© ${new Date().getFullYear()} Все права защищены</p>
        </div>
      </div>
    </body>
    </html>
  `;
  },
};

// Вспомогательные функции
function getDeliveryName(method: string): string {
  const names: Record<string, string> = {
    COURIER: 'Курьер (бесплатно)',
    PICKUP: 'Самовывоз из пункта выдачи',
    MAIL: 'Почта России',
    CDEK: 'СДЭК',
    OZON: 'Озон Логистика',
  };
  return names[method] || method;
}

function getDeliveryDays(method: string): number {
  const days: Record<string, number> = {
    COURIER: 5,
    PICKUP: 3,
    MAIL: 7,
    CDEK: 3,
    OZON: 2,
  };
  return days[method] || 5;
}

function getExpectedDeliveryDate(method: string): string {
  const days = getDeliveryDays(method);
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('ru-RU', { weekday: 'long', month: 'long', day: 'numeric' });
}
