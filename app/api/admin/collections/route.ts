import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const collections = await prisma.collection.findMany({
      include: {
        products: { include: { product: true } },
        discount: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(collections);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { name, slug, description, image, sortOrder, productIds, active } = await req.json();

    const collection = await prisma.collection.create({
      data: {
        name,
        slug,
        description,
        image,
        sortOrder: sortOrder || 0,
        active: active ?? true,
        products: {
          create: (productIds || []).map((productId: number) => ({ productId })),
        },
      },
      include: {
        products: { include: { product: true } },
        discount: true,
      },
    });

    return NextResponse.json(collection);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
