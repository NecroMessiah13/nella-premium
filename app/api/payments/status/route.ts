import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPayment } from '@/lib/yookassa';
import { sendEmail, emailTemplates } from '@/lib/email';
import { currentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = Number(searchParams.get('orderId'));

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const u = await currentUser();
    if (u && order.userId && order.userId !== u.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({ paymentStatus: 'PAID', status: order.status, orderId });
    }

    if (order.paymentId) {
      try {
        const payment = await getPayment(order.paymentId);
        if ((payment.status === 'succeeded' || payment.status === 'waiting_for_capture') && payment.paid === true) {
          if (order.paymentStatus !== 'PAID') {
            await prisma.order.update({
              where: { id: order.id },
              data: { paymentStatus: 'PAID', status: 'PROCESSING' },
            });
            try {
              await sendEmail({
                to: order.email,
                subject: `Платёж принят — Заказ #${order.id}`,
                html: emailTemplates.paymentConfirmation(order),
              });
            } catch (emailError) {
              console.error('Failed to send payment confirmation email:', emailError);
            }
            console.log('Payment confirmed (poll) for order:', order.id, 'paymentId:', order.paymentId);
          }
          return NextResponse.json({ paymentStatus: 'PAID', status: 'PROCESSING', orderId });
        }
        if (payment.status === 'canceled') {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'FAILED' },
          });
          return NextResponse.json({ paymentStatus: 'FAILED', status: order.status, orderId });
        }
      } catch (paymentError) {
        console.error('YooKassa status fetch error:', paymentError);
      }
    }

    return NextResponse.json({ paymentStatus: order.paymentStatus || 'PENDING', status: order.status, orderId });
  } catch (e) {
    console.error('Payment status error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Payment status check failed' },
      { status: 500 }
    );
  }
}