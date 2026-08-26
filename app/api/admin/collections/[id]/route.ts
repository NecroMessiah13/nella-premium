import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const collection = await prisma.collection.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        products: { include: { product: true } },
        discount: true,
      },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json(collection);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { name, slug, description, image, sortOrder, productIds, active } = await req.json();
    const id = parseInt(params.id);

    // Remove old products
    await prisma.collectionProduct.deleteMany({
      where: { collectionId: id },
    });

    const collection = await prisma.collection.update({
      where: { id },
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    await prisma.collection.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
  }
}
