import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { code, description, type, value, maxUses, active, productId, collectionId, startsAt, expiresAt } = await req.json();
    const id = parseInt(params.id);

    const discount = await prisma.discount.update({
      where: { id },
      data: {
        code: code.toUpperCase(),
        description,
        type,
        value,
        maxUses,
        active,
        productId: productId || null,
        collectionId: collectionId || null,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        product: { select: { id: true, name: true } },
        collection: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(discount);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    await prisma.discount.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete discount' }, { status: 500 });
  }
}
