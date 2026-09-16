import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, emailTemplates } from '@/lib/email';
import { currentUser, getOrCreateGuestId } from '@/lib/auth';
import { lookupPromoCode, promoAmount, incrementPromoUse } from '@/lib/promocode';
import { customerLog } from '@/lib/customerLog';

function computeDiscountPrice(price: number, d: { type: string; value: number } | null | undefined): number {
  if (!d) return price;
  if (d.type === 'PERCENT') return Math.max(0, Math.round(price * (100 - d.value) / 100));
  if (d.type === 'FIXED') return Math.max(0, price - d.value);
  return price;
}

export async function POST(r: Request) {
  try {
    const b = await r.json();
    
    if (!b.customerName || !b.email || !Array.isArray(b.items) || !b.items.length) {
      return NextResponse.json(
        {error: 'Заполните данные покупателя и корзину'},
        {status: 400}
      );
    }

    const ids = b.items.map((x: any) => Number(x.productId));
    const ps = await prisma.product.findMany({
      where: {id: {in: ids}},
      include: {variants: true, category: true, discount: true}
    });

    if (ps.length !== new Set(ids).size) {
      throw new Error('Товар не найден');
    }

    // База товаров по текущим ценам (без скидки)
    const baseTotal = b.items.reduce(
      (s: number, x: any) =>
        s + (ps.find(p => p.id === Number(x.productId))?.price || 0) * Number(x.quantity),
      0
    );

    // Скидки на товары (постоянные, активные)
    const isActive = (d: { active: boolean; startsAt: Date | null; expiresAt: Date | null }) =>
      d.active && (!d.startsAt || d.startsAt <= new Date()) && (!d.expiresAt || d.expiresAt >= new Date());

    let itemsTotalAfterDiscount = b.items.reduce((s: number, x: any) => {
      const p = ps.find(pp => pp.id === Number(x.productId));
      const d = p?.discount && isActive(p.discount as any) ? p.discount : null;
      return s + computeDiscountPrice(p?.price || 0, d as any) * Number(x.quantity);
    }, 0);

    // Промокод (DiscountCode или универсальный Discount)
    let promoDiscount = 0;
    const promoCode = typeof b.promoCode === 'string' ? b.promoCode.trim().toUpperCase() || null : null;
    if (promoCode) {
      const dc = await lookupPromoCode(promoCode);
      if (!dc) {
        return NextResponse.json(
          { error: 'Промокод недействителен' },
          { status: 400 }
        );
      }
      promoDiscount = promoAmount(dc, itemsTotalAfterDiscount);
      await incrementPromoUse(dc);
    }

    const deliveryCost = Math.max(0, Number(b.deliveryCost || 0));
    const discountTotal = (baseTotal - itemsTotalAfterDiscount) + promoDiscount;
    const total = baseTotal + deliveryCost - discountTotal;

    const guestId = await getOrCreateGuestId();

    const order = await prisma.$transaction(async tx => {
      // Проверяем остатки
      for (const x of b.items) {
        const variant = await tx.productVariant.findFirst({
          where: {
            productId: Number(x.productId),
            size: x.size
          }
        });

        if (!variant) {
          throw new Error(`Размер ${x.size} не найден`);
        }
        if (variant.stock < Number(x.quantity)) {
          throw new Error(`Недостаточно товара в размере ${x.size}. Доступно: ${variant.stock}, требуется: ${x.quantity}`);
        }
      }

      // Создаём заказ с доставкой
      const o = await tx.order.create({
        data: {
          customerName: b.customerName,
          email: b.email,
          phone: b.phone || null,
          address: b.address || null,
          deliveryMethod: b.deliveryMethod || 'COURIER',
          deliveryCost: deliveryCost,
          total: total,
          discountAmount: discountTotal,
          promoCode: promoCode,
          guestId,
          items: {
            create: b.items.map((x: any) => {
              const p = ps.find(p => p.id === Number(x.productId))!;
              return {
                productId: p.id,
                name: p.name,
                price: p.price,
                size: x.size,
                color: x.color || p.color,
                quantity: Number(x.quantity)
              };
            })
          }
        }
      });

      // Уменьшаем остатки
      for (const x of b.items) {
        await tx.productVariant.updateMany({
          where: {
            productId: Number(x.productId),
            size: x.size
          },
          data: {stock: {decrement: Number(x.quantity)}}
        });
      }

      return o;
    });

    // Получаем полную информацию о заказе с товарами для письма
    const orderWithItems = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true }
    });

    // Привязываем заказ к авторизованному пользователю (если есть)
    const u = await currentUser();
    if (u) {
      await prisma.order.update({
        where: { id: order.id },
        data: { userId: u.id },
      });
    }

    void customerLog({
      userId: u?.id ?? null,
      email: u?.email ?? b.email ?? null,
      action: "ORDER_CREATE",
      entity: "order",
      entityId: order.id,
      details: { total, items: b.items.length, promoCode, customerName: b.customerName },
      withGuest: !u,
    });

    // Отправляем email об оформлении заказа (асинхронно, без ожидания)
    try {
      if (orderWithItems) {
        sendEmail({
          to: orderWithItems.email,
          subject: `Заказ #${orderWithItems.id} подтвержден — Nella Premium`,
          html: emailTemplates.orderConfirmation(orderWithItems)
        }).catch(err => {
          console.error('Failed to send order confirmation email:', err);
        });
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Не прерываем процесс если email не отправился
    }

    return NextResponse.json(order, {status: 201});
  } catch (e) {
    console.error('Order error:', e);
    return NextResponse.json(
      {error: e instanceof Error ? e.message : 'Ошибка заказа'},
      {status: 400}
    );
  }
}