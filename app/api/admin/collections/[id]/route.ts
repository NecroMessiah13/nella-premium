import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { id } = await params;
    const collection = await prisma.collection.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: { include: { product: true } },
        discount: true,
      },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json(collection);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { id } = await params;
    const { name, slug, description, image, sortOrder, productIds, active } = await req.json();

    await prisma.collectionProduct.deleteMany({
      where: { collectionId: parseInt(id) },
    });

    const collection = await prisma.collection.update({
      where: { id: parseInt(id) },
      data: {
        name,
        slug,
        description,
        image,
        sortOrder: sortOrder || 0,
        active: active ?? true,
        ...(productIds && productIds.length
          ? { products: { create: productIds.map((productId: number) => ({ productId })) } }
          : {}),
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { id } = await params;
    await prisma.collection.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
