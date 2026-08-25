import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { orderId, eventType, trackingNumber } = await request.json();

    if (!orderId || !eventType) {
      return NextResponse.json(
        { error: 'Missing orderId or eventType' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: { items: true }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    let html = '';
    let subject = '';

    switch (eventType) {
      case 'ORDER_CONFIRMED':
        subject = `Заказ #${order.id} подтвержден — Nella Premium`;
        html = emailTemplates.orderConfirmation(order);
        break;

      case 'PAYMENT_CONFIRMED':
        subject = `Платёж принят — Заказ #${order.id}`;
        html = emailTemplates.paymentConfirmation(order);
        break;

      case 'SHIPPING_STARTED':
        if (!trackingNumber) {
          return NextResponse.json(
            { error: 'trackingNumber required for SHIPPING_STARTED' },
            { status: 400 }
          );
        }
        subject = `Ваш заказ отправлен — Трекинг #${trackingNumber}`;
        html = emailTemplates.shippingNotification(order, trackingNumber);
        break;

      case 'DELIVERY_CONFIRMED':
        subject = `Ваш заказ #${order.id} доставлен!`;
        html = emailTemplates.deliveryConfirmation(order);
        break;

      default:
        return NextResponse.json(
          { error: 'Unknown event type' },
          { status: 400 }
        );
    }

    // Отправляем email
    await sendEmail({
      to: order.email,
      subject,
      html,
    });

    console.log(`Email sent for order ${orderId}: ${eventType}`);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (e) {
    console.error('Email sending error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Email sending failed' },
      { status: 500 }
    );
  }
}
