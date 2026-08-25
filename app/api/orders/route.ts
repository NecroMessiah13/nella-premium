import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {sendEmail, emailTemplates} from '@/lib/email';
import {currentUser} from '@/lib/auth';

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
      include: {variants: true, category: true}
    });

    if (ps.length !== new Set(ids).size) {
      throw new Error('Товар не найден');
    }

    const baseTotal = b.items.reduce(
      (s: number, x: any) =>
        s + (ps.find(p => p.id === Number(x.productId))?.price || 0) * Number(x.quantity),
      0
    );

    const deliveryCost = Math.max(0, Number(b.deliveryCost || 0));
    const total = baseTotal + deliveryCost;

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
