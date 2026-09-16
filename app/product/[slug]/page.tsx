import { prisma } from '@/lib/prisma';
import { ProductView } from './ProductView';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await prisma.product.findUnique({
    where: { slug },
    include: { category: true, images: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!p) return { title: 'Товар не найден — Nella Premium' };
  return {
    title: `${p.name} — Nella Premium`,
    description: p.description || `Купить ${p.name}: ${p.color}, ${p.category.name}. Nella Premium.`,
    openGraph: {
      title: `${p.name} — Nella Premium`,
      description: p.description || undefined,
      images: p.images && p.images[0] ? p.images[0].url : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductView slug={slug} />;
}