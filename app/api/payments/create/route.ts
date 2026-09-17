import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPayment } from '@/lib/yookassa';
import { currentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: { items: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Мягкая проверка владельца: если пользователь авторизован,
    // заказ должен принадлежать ему (гостевые заказы без userId — разрешены)
    const u = await currentUser();
    if (u && order.userId && order.userId !== u.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Проверяем статус платежа - если уже оплачен, не создаём новый
    if (order.paymentStatus === 'PAID') {
      return NextResponse.redirect(new URL('/payment/success', request.url));
    }

    try {
      // Создаём платёж в YooKassa
      const payment = await createPayment(
        order.id,
        order.total,
        `Заказ №${order.id} - Nella Premium`
      );

      // Сохраняем payment ID (оплата подтвердится через webhook)
      await prisma.order.update({
        where: { id: Number(orderId) },
        data: {
          paymentId: payment.id,
        }
      });

      // Перенаправляем на URL подтверждения платежа
      if (payment.confirmation?.confirmation_url) {
        return NextResponse.redirect(payment.confirmation.confirmation_url);
      }

      // Fallback - если нет confirmation_url
      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        status: payment.status
      });
    } catch (paymentError: any) {
      console.error('YooKassa error:', paymentError.response?.data || paymentError.message);
      
      // В режиме тестирования - перенаправляем на страницу успеха и помечаем заказ оплаченным
      if (process.env.YOOKASSA_MODE === 'test') {
        await prisma.order.update({
          where: { id: Number(orderId) },
          data: { paymentStatus: 'PAID', status: 'PROCESSING' }
        }).catch(() => {});
        return NextResponse.redirect(
          new URL(`/payment/success?orderId=${orderId}&test=true`, request.url)
        );
      }

      throw paymentError;
    }
  } catch (e) {
    console.error('Payment creation error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Payment creation failed' },
      { status: 500 }
    );
  }
}
