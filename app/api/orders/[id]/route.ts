import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser, getOrCreateGuestId } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const tokenGuest = url.searchParams.get('guest');
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
    // Гостевой заказ: по guest-куке браузера или по токену из ссылки письма
    const cookieGuest = await getOrCreateGuestId();
    const hasCookie = !!cookieGuest && cookieGuest === o.guestId;
    const hasToken = !!tokenGuest && tokenGuest === o.guestId;
    if (!hasCookie && !hasToken) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }
  }

  return NextResponse.json(o);
}