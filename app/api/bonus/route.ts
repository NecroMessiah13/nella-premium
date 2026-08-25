import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // Получить баланс бонусов для анонимного пользователя
  // Возвращаем 0, так как у анонимных пользователей нет бонусов
  return NextResponse.json({ bonus: 0, message: 'Войдите чтобы видеть бонусы' });
}

export async function POST() {
  return NextResponse.json(
    { error: 'Войдите для использования бонусов' },
    { status: 401 }
  );
}
