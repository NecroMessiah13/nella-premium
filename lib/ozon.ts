import axios from 'axios';

const OZON_API_URL = 'https://api.ozonlogistics.com/api/v1';

interface OzonShipment {
  order_id: string;
  items: Array<{
    sku: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  recipient: {
    name: string;
    phone: string;
    email: string;
  };
  address: {
    city: string;
    street: string;
    house: string;
    flat?: string;
    postal_code: string;
  };
  comment?: string;
}

// Создать отправку в Озон
export async function createOzonShipment(
  orderId: number,
  order: any
): Promise<any> {
  try {
    const shipment: OzonShipment = {
      order_id: `NELLA-${orderId}`,
      items: order.items.map((item: any) => ({
        sku: `SKU-${item.id}`,
        name: item.name,
        quantity: item.quantity,
        price: item.price / 100,
      })),
      recipient: {
        name: order.customerName,
        phone: order.phone,
        email: order.email,
      },
      address: parseOzonAddress(order.address),
      comment: `Заказ Nella Premium #${orderId}`,
    };

    const response = await axios.post(`${OZON_API_URL}/shipments`, shipment, {
      headers: {
        Authorization: `Bearer ${process.env.OZON_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      shipmentId: response.data.id,
      trackingNumber: response.data.tracking_number,
      status: 'created',
    };
  } catch (error) {
    console.error('Ozon shipment creation error:', error);
    throw error;
  }
}

// Получить статус отправки
export async function getOzonShipmentStatus(shipmentId: string): Promise<any> {
  try {
    const response = await axios.get(
      `${OZON_API_URL}/shipments/${shipmentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.OZON_API_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Ozon shipment status error:', error);
    throw error;
  }
}

// Парсить адрес для Озона
function parseOzonAddress(address: string): any {
  const parts = address.split(',').map(p => p.trim());
  
  return {
    city: parts[0] || 'Москва',
    street: parts[1] || 'ул. Примерная',
    house: parts[2] || '1',
    flat: parts[3],
    postal_code: '101000', // Нужно обогатить эту информацию
  };
}

// Получить доступные ПВЗ (пункты выдачи) Озона
export async function getOzonPickupPoints(city: string): Promise<any[]> {
  try {
    const response = await axios.get(`${OZON_API_URL}/pickup-points`, {
      params: { city },
      headers: {
        Authorization: `Bearer ${process.env.OZON_API_KEY}`,
      },
    });

    return response.data.points || [];
  } catch (error) {
    console.error('Ozon pickup points error:', error);
    return [];
  }
}

// Рассчитать стоимость доставки в Озоне
export async function calculateOzonShipping(
  cityFrom: string,
  cityTo: string,
  weight: number
): Promise<any> {
  try {
    const response = await axios.post(
      `${OZON_API_URL}/calculate-shipping`,
      {
        city_from: cityFrom,
        city_to: cityTo,
        weight,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OZON_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Ozon shipping calculation error:', error);
    throw error;
  }
}
