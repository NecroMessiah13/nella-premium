import { prisma } from '@/lib/prisma';

export async function lookupPromoCode(code: string) {
  const upper = code.trim().toUpperCase();
  if (!upper) return null;
  const now = new Date();
  const inPeriod = (c: { active: boolean; startsAt: Date | null; expiresAt: Date | null }) =>
    c.active && (!c.startsAt || c.startsAt <= now) && (!c.expiresAt || c.expiresAt >= now);
  const usageOk = (c: { maxUses: number | null; usedCount: number }) =>
    c.maxUses == null || c.usedCount < c.maxUses;

  const [dc, d] = await Promise.all([
    prisma.discountCode.findUnique({ where: { code: upper } }),
    prisma.discount.findFirst({
      where: { code: upper, productId: null, collectionId: null, active: true },
    }),
  ]);

  const chosen = dc && inPeriod(dc) && usageOk(dc)
    ? { kind: 'code' as const, dbId: dc.id, type: dc.type, value: dc.value, label: dc.code }
    : d && inPeriod(d) && usageOk(d)
      ? { kind: 'discount' as const, dbId: d.id, type: d.type, value: d.value, label: d.code }
      : null;

  return chosen;
}

export function promoAmount(
  code: { kind: 'code' | 'discount'; type: string; value: number },
  subtotal: number
): number {
  const amount = code.type === 'PERCENT'
    ? Math.round(Number(subtotal) * code.value / 100)
    : code.value;
  return Math.min(amount, Math.max(0, Number(subtotal) || 0));
}

export async function incrementPromoUse(code: { kind: 'code' | 'discount'; dbId: number }) {
  try {
    if (code.kind === 'code') {
      await prisma.discountCode.update({
        where: { id: code.dbId },
        data: { usedCount: { increment: 1 } },
      });
    } else {
      await prisma.discount.update({
        where: { id: code.dbId },
        data: { usedCount: { increment: 1 } },
      });
    }
  } catch (e) {
    console.error('incrementPromoUse error:', e);
  }
}