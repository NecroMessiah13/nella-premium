import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser, getOrCreateGuestId } from '@/lib/auth';
import { customerLog } from '@/lib/customerLog';

export async function GET() {
  try {
    const user = await currentUser();
    const guestId = await getOrCreateGuestId();
    const where = user
      ? { userId: user.id }
      : { userId: null, guestId };
    const items = await prisma.wishlist.findMany({ where, select: { productId: true } });
    return NextResponse.json({ items: items.map(i => i.productId) });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: 'productId обязателен' }, { status: 400 });
    }
    const user = await currentUser();
    const guestId = await getOrCreateGuestId();
    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    if (!product) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }
    const data = user
      ? { userId: user.id }
      : { userId: null, guestId };
    const where = user
      ? { userId_productId: { userId: user.id, productId: product.id } }
      : { guestId_productId: { guestId, productId: product.id } };
    await prisma.wishlist.upsert({ where, update: {}, create: { ...data, productId: product.id } });
    void customerLog({
      userId: user?.id ?? null,
      email: user?.email ?? null,
      action: "WISHLIST_ADD",
      entity: "product",
      entityId: product.id,
      details: { name: product.name, slug: product.slug },
      withGuest: !user,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Ошибка' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = Number(searchParams.get('productId'));
    if (!productId) {
      return NextResponse.json({ error: 'productId обязателен' }, { status: 400 });
    }
    const user = await currentUser();
    const guestId = await getOrCreateGuestId();
    const where = user
      ? { userId: user.id, productId }
      : { userId: null, guestId, productId };
    await prisma.wishlist.deleteMany({ where });
    void customerLog({
      userId: user?.id ?? null,
      email: user?.email ?? null,
      action: "WISHLIST_REMOVE",
      entity: "product",
      entityId: productId,
      withGuest: !user,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Ошибка' }, { status: 400 });
  }
}