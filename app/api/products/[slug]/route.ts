import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';

export async function GET(_: Request, {params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  
  const p = await prisma.product.findUnique({
    where: {slug},
    include: {category: true, variants: true, images: true}
  });
  
  if (!p) return NextResponse.json({error: 'Товар не найден'}, {status: 404});
  
  // Скрываем остатки для публичного API
  return NextResponse.json({
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
  });
}
