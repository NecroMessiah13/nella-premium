import {NextRequest, NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';

export async function GET(r: NextRequest) {
  const q = r.nextUrl.searchParams,
    cat = q.get('category'),
    sort = q.get('sort'),
    collection = q.get('collection');

  const where = {
    ...(cat && cat !== 'Все' ? {category: {slug: cat}} : {}),
    ...(collection ? {collections: {some: {collection: {slug: collection}}}} : {})
  };

  const rows = await prisma.product.findMany({
    where: Object.keys(where).length ? where : undefined,
    include: {category: true, variants: true, images: true},
    orderBy: sort === 'price' ? {price: 'asc'} : sort === 'priceDesc' ? {price: 'desc'} : {createdAt: 'desc'}
  });
  
  // Скрываем остатки для публичного API
  return NextResponse.json(
    rows.map(p => ({
      ...p,
      category: p.category.name,
      categorySlug: p.category.slug,
      variants: p.variants.map(v => ({
        id: v.id,
        sku: v.sku,
        size: v.size,
        color: v.color
        // stock НЕ отправляем
      }))
    }))
  );
}

export async function POST(r: Request) {
  try {
    const b = await r.json();
    const p = await prisma.product.create({
      data: {
        slug: b.slug,
        name: b.name,
        description: b.description || null,
        price: Number(b.price),
        color: b.color,
        tone: b.tone,
        badge: b.badge || null,
        categoryId: Number(b.categoryId),
        variants: {
          create: (b.variants || []).map((v: any) => ({
            sku: v.sku,
            size: v.size,
            color: v.color,
            stock: Number(v.stock)
          }))
        }
      },
      include: {category: true, variants: true}
    });
    return NextResponse.json(p, {status: 201});
  } catch {
    return NextResponse.json({error: 'Не удалось создать товар'}, {status: 400});
  }
}
