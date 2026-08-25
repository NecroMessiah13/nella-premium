import axios from 'axios';

const CDEK_API_URL = 'https://api.cdek.ru/v2';
const CDEK_TEST_URL = 'https://api.edu.cdek.ru/v2'; // Test URL

interface CDEKAuth {
  client_id: string;
  client_secret: string;
}

interface CDEKOrder {
  number: string; // внешний ID заказа
  tariff_code: number;
  comment?: string;
  shipper: {
    name: string;
    phones?: Array<{
      number: string;
    }>;
  };
  sender: {
    name: string;
    phones?: Array<{
      number: string;
    }>;
    address: {
      country_code: string;
      city: string;
      street: string;
      house: string;
      flat?: string;
    };
  };
  recipient: {
    name: string;
    phones?: Array<{
      number: string;
    }>;
    address: {
      country_code: string;
      city: string;
      street: string;
      house: string;
      flat?: string;
    };
  };
  packages: Array<{
    number: string;
    weight: number; // граммы
    length: number; // см
    width: number;
    height: number;
    items: Array<{
      name: string;
      ware_key: string;
      payment?: {
        value: number;
      };
      amount: number;
      weight: number;
    }>;
  }>;
}

let cdekAccessToken: string | null = null;
let cdekTokenExpiry: number | null = null;

// Получить токен доступа
async function getCDEKToken(isTest: boolean = true): Promise<string> {
  // Если токен ещё действует, используем его
  if (cdekAccessToken && cdekTokenExpiry && cdekTokenExpiry > Date.now()) {
    return cdekAccessToken;
  }

  try {
    const url = `${isTest ? CDEK_TEST_URL : CDEK_API_URL}/auth/token`;
    
    const clientId = process.env.CDEK_API_KEY;
    const clientSecret = process.env.CDEK_ACCOUNT;
    if (!clientId || !clientSecret) {
      throw new Error('CDEK_API_KEY / CDEK_ACCOUNT are not configured');
    }

    const response = await axios.post(url, {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    cdekAccessToken = response.data.access_token;
    cdekTokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 60 сек запаса

    return cdekAccessToken;
  } catch (error) {
    console.error('CDEK token error:', error);
    throw error;
  }
}

// Создать заказ в СДЭК
export async function createCDEKOrder(
  orderId: number,
  order: any,
  isTest: boolean = true
): Promise<any> {
  try {
    const token = await getCDEKToken(isTest);

    const cdekOrder: CDEKOrder = {
      number: `NELLA-${orderId}`,
      tariff_code: 137, // Доставка по России (Экспресс)
      comment: `Заказ Nella Premium #${orderId}`,
      shipper: {
        name: 'Nella Premium',
      },
      sender: {
        name: 'Nella Premium',
        address: {
          country_code: 'RU',
          city: 'Москва',
          street: 'ул. Примерная',
          house: '1',
        },
      },
      recipient: {
        name: order.customerName,
        phones: [{ number: order.phone }],
        address: parseAddress(order.address),
      },
      packages: [
        {
          number: `PKG-${orderId}`,
          weight: 500, // граммы (примерно)
          length: 30, // см
          width: 20,
          height: 10,
          items: order.items.map((item: any) => ({
            name: item.name,
            ware_key: `ITEM-${item.id}`,
            amount: item.quantity,
            weight: 100,
          })),
        },
      ],
    };

    const url = `${isTest ? CDEK_TEST_URL : CDEK_API_URL}/orders`;

    const response = await axios.post(url, cdekOrder, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      cdekOrderUuid: response.data.uuid,
      trackingNumber: response.data.requests?.[0]?.request_uuid,
      status: 'created',
    };
  } catch (error) {
    console.error('CDEK order creation error:', error);
    throw error;
  }
}

// Получить статус заказа
export async function getCDEKOrderStatus(
  cdekOrderUuid: string,
  isTest: boolean = true
): Promise<any> {
  try {
    const token = await getCDEKToken(isTest);

    const url = `${isTest ? CDEK_TEST_URL : CDEK_API_URL}/orders/${cdekOrderUuid}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('CDEK status error:', error);
    throw error;
  }
}

// Парсить адрес
function parseAddress(address: string): any {
  // Простой парсер адреса (можно улучшить)
  const parts = address.split(',').map(p => p.trim());
  
  return {
    country_code: 'RU',
    city: parts[0] || 'Москва',
    street: parts[1] || 'ул. Примерная',
    house: parts[2] || '1',
    flat: parts[3],
  };
}

// Получить города СДЭК
export async function getCDEKCities(search: string, isTest: boolean = true): Promise<any[]> {
  try {
    const token = await getCDEKToken(isTest);

    const url = `${isTest ? CDEK_TEST_URL : CDEK_API_URL}/location/cities`;

    const response = await axios.get(url, {
      params: { city: search, size: 10 },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('CDEK cities error:', error);
    return [];
  }
}

// Рассчитать стоимость доставки
export async function calculateCDEKCost(
  fromCity: string,
  toCity: string,
  weight: number,
  isTest: boolean = true
): Promise<any> {
  try {
    const token = await getCDEKToken(isTest);

    const url = `${isTest ? CDEK_TEST_URL : CDEK_API_URL}/calculator/tarifflist`;

    const response = await axios.post(
      url,
      {
        from_location: { city: fromCity },
        to_location: { city: toCity },
        packages: [
          {
            weight,
            length: 30,
            width: 20,
            height: 10,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('CDEK calculation error:', error);
    throw error;
  }
}
