import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { adminLog } from '@/lib/adminLog';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { id } = await params;
    const { code, description, type, value, maxUses, active, startsAt, expiresAt } = await req.json();

    const promo = await prisma.discountCode.update({
      where: { id: parseInt(id) },
      data: {
        code: String(code || '').toUpperCase().trim(),
        description,
        type,
        value,
        maxUses,
        active: active ?? true,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    await adminLog(admin, "UPDATE", "promoCode", id, { code: promo.code });

    return NextResponse.json(promo);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { id } = await params;
    await prisma.discountCode.delete({
      where: { id: parseInt(id) },
    });

    await adminLog(admin, "DELETE", "promoCode", id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}