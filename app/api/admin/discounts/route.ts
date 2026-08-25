import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const discounts = await prisma.discount.findMany({
      include: {
        product: { select: { id: true, name: true } },
        collection: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(discounts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { code, description, type, value, maxUses, productId, collectionId, startsAt, expiresAt } = await req.json();

    const discount = await prisma.discount.create({
      data: {
        code: code.toUpperCase(),
        description,
        type,
        value,
        maxUses,
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
