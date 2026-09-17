import { NextResponse } from 'next/server';
import { getCDEKRates } from '@/lib/cdek';
import { calculatePochtaRate } from '@/lib/pochta';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const service = (searchParams.get('service') || 'CDEK').toUpperCase();
  const weight = Math.max(1, Math.round(Number(searchParams.get('weight') || 300)));

  if (service === 'MAIL') {
    const index = (searchParams.get('index') || '').trim();
    if (!/^\d{6}$/.test(index)) {
      return NextResponse.json({ tariffs: [], error: 'Укажите индекс доставки' });
    }
    const { cost } = await calculatePochtaRate({ toIndex: index, weight });
    if (cost === null) {
      return NextResponse.json({ tariffs: [], error: 'Расчёт Почты России временно недоступен' });
    }
    return NextResponse.json({
      tariffs: [
        {
          code: 'MAIL',
          name: 'Почта России',
          cost,
          daysMin: null,
          daysMax: null,
          currency: 'RUB',
        },
      ],
      senderCity: process.env.POCHTA_SENDER_CITY || 'Георгиевск',
      weight,
    });
  }

  if (!process.env.CDEK_API_KEY || !process.env.CDEK_ACCOUNT) {
    return NextResponse.json({ tariffs: [], error: 'Доставка СДЭК временно недоступна' });
  }

  const city = (searchParams.get('city') || '').trim();
  if (!city || city.length < 2) {
    return NextResponse.json({ tariffs: [], error: 'Укажите город доставки' });
  }

  try {
    const isTest = process.env.CDEK_MODE !== 'prod';
    const tariffs = await getCDEKRates(city, weight, { isTest });
    return NextResponse.json({
      tariffs,
      senderCity: process.env.CDEK_SENDER_CITY || 'Георгиевск',
      weight,
      isTest,
    });
  } catch (error: any) {
    console.error('CDEK rates error:', error?.response?.data || error.message);
    return NextResponse.json({ tariffs: [], error: 'Не удалось получить тарифы СДЭК' });
  }
}