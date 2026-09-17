import { NextResponse } from 'next/server';
import { getCDEKRates } from '@/lib/cdek';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = (searchParams.get('city') || '').trim();
  const weight = Math.max(1, Math.round(Number(searchParams.get('weight') || 300)));

  if (!process.env.CDEK_API_KEY || !process.env.CDEK_ACCOUNT) {
    return NextResponse.json({ tariffs: [], error: 'Доставка СДЭК временно недоступна' });
  }

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