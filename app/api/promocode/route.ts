import { NextResponse } from 'next/server';
import { lookupPromoCode, promoAmount } from '@/lib/promocode';

export async function POST(r: Request) {
  try {
    const { code, subtotal } = await r.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Введите промокод' }, { status: 400 });
    }
    const found = await lookupPromoCode(code);
    if (!found) {
      return NextResponse.json({ error: 'Промокод недействителен' }, { status: 400 });
    }
    return NextResponse.json({
      code: found.label,
      discount: promoAmount(found, subtotal),
      description: null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Ошибка' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  return NextResponse.json({ ok: true });
}