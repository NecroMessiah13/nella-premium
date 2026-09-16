import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {computeOfferPrice} from '@/lib/products';

export async function GET(_: Request, {params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  
  const p = await prisma.product.findUnique({
    where: {slug},
    include: {category: true, variants: true, images: true, discount: true}
  });
  
  if (!p) return NextResponse.json({error: 'Товар не найден'}, {status: 404});
  
  // Скрываем остатки для публичного API
  return NextResponse.json({
    ...p,
    discount: undefined,
    category: p.category.name,
    categorySlug: p.category.slug,
    offerPrice: computeOfferPrice(p.price, p.discount as any),
    variants: p.variants.map(v => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      inStock: v.stock > 0
      // stock НЕ отправляем, только булев признак наличия
    }))
  });
}