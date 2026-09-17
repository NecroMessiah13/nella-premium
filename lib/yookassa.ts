import axios from 'axios';

// Конфигурация YooKassa
export const yookassaConfig = {
  shopId: process.env.YOOKASSA_SHOP_ID ?? '',
  secretKey: process.env.YOOKASSA_SECRET_KEY ?? '',
  apiUrl: 'https://api.yookassa.ru/v3',
};

function requireCreds() {
  if (!yookassaConfig.shopId || !yookassaConfig.secretKey) {
    throw new Error('YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY are not configured');
  }
}

// Создание платежа
export async function createPayment(orderId: number, amount: number, description: string) {
  try {
    requireCreds();
    const idempotenceKey = `${orderId}-${Date.now()}`;
    
    const response = await axios.post(
      `${yookassaConfig.apiUrl}/payments`,
      {
        amount: {
          value: Number(amount).toFixed(2),
          currency: 'RUB'
        },
        payment_method_data: {
          type: 'bank_card'
        },
        confirmation: {
          type: 'redirect',
          return_url: `${process.env.YOOKASSA_RETURN_URL || `${process.env.APP_URL || 'http://localhost:3000'}/payment/success`}?orderId=${orderId}`
        },
        description: description,
        metadata: {
          orderId: orderId.toString()
        }
      },
      {
        headers: {
          'Idempotence-Key': idempotenceKey,
          'Authorization': `Basic ${Buffer.from(`${yookassaConfig.shopId}:${yookassaConfig.secretKey}`).toString('base64')}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('YooKassa payment creation error:', error);
    throw error;
  }
}

// Получение информации о платеже
export async function getPayment(paymentId: string) {
  try {
    requireCreds();
    const response = await axios.get(
      `${yookassaConfig.apiUrl}/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${yookassaConfig.shopId}:${yookassaConfig.secretKey}`).toString('base64')}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('YooKassa payment fetch error:', error);
    throw error;
  }
}

// Проверка подписи webhook
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secretKey: string
): boolean {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(body)
    .digest('base64');

  return hash === signature;
}
