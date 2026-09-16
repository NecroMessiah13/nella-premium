import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser, getOrCreateGuestId } from '@/lib/auth';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const o = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: { items: true },
  });
  if (!o) return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });

  const u = await currentUser();

  if (o.userId) {
    // Авторизованный владелец
    if (!u || u.id !== o.userId) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }
  } else {
    // Гостевой заказ: показываем только по guest-куке того же браузера
    const guestId = await getOrCreateGuestId();
    if (!o.guestId || o.guestId !== guestId) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }
  }

  return NextResponse.json(o);
}