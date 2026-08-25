import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  // Получить wishlist из localStorage на клиенте или использовать анонимные товары
  // Пока возвращаем пустой массив для анонимных пользователей
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  try {
    const { productId, action } = await req.json();

    if (!productId || !action) {
      return NextResponse.json(
        { error: 'productId и action обязательны' },
        { status: 400 }
      );
    }

    if (action === 'add') {
      // Для простоты - сохраняем в localStorage на клиенте
      // Но также можно сохранить в cookies
      return NextResponse.json({ ok: true, message: 'Добавлено в избранное' });
    } else if (action === 'remove') {
      return NextResponse.json({ ok: true, message: 'Удалено из избранного' });
    }

    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Ошибка' },
      { status: 400 }
    );
  }
}
