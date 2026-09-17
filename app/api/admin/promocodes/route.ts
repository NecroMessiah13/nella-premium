import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { adminLog } from '@/lib/adminLog';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const promos = await prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(promos);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch promocodes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { code, description, type, value, maxUses, active, startsAt, expiresAt } = await req.json();

    const promo = await prisma.discountCode.create({
      data: {
        code: String(code || '').toUpperCase().trim(),
        description,
        type: type || 'PERCENT',
        value,
        maxUses,
        active: active ?? true,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    await adminLog(admin, "CREATE", "promoCode", promo.id, { code: promo.code });

    return NextResponse.json(promo);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}