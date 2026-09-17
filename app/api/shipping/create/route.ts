import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCDEKOrder } from '@/lib/cdek';
import { sendEmail, emailTemplates } from '@/lib/email';
import { currentUser } from '@/lib/auth';
import crypto from 'crypto';

// Генерировать трекинг номер
function generateTrackingNumber(): string {
  return 'NEL-' + crypto.randomBytes(8).toString('hex').toUpperCase();
}

export async function POST(request: Request) {
  try {
    const { orderId, carrier } = await request.json();

    if (!orderId || !carrier) {
      return NextResponse.json(
        { error: 'Missing orderId or carrier' },
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

    // Мягкая проверка владельца (см. payments/create)
    const u = await currentUser();
    if (u && order.userId && order.userId !== u.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.status !== 'PROCESSING') {
      return NextResponse.json(
        { error: 'Order must be in PROCESSING status' },
        { status: 400 }
      );
    }

    let trackingNumber = generateTrackingNumber();
    let carrierData: any = {};

    // Создаём отправку в зависимости от выбранного перевозчика
    switch (carrier) {
      case 'CDEK':
        try {
          const cdekResult = await createCDEKOrder(Number(orderId), order);
          trackingNumber = cdekResult.trackingNumber || trackingNumber;
          carrierData = cdekResult;
        } catch (cdekError: any) {
          console.error('CDEK error:', cdekError);
          return NextResponse.json(
            { error: 'CDEK delivery is not configured or failed: ' + (cdekError?.message || 'unknown error') },
            { status: 502 }
          );
        }
        break;

      case 'OZON':
        // Доставка через Ozon (оформляется после подтверждения заказа)
        carrierData = {
          carrier: 'OZON',
          status: 'assigned'
        };
        break;

      case 'COURIER':
      default:
        // Собственный курьер
        carrierData = {
          carrier: 'COURIER',
          status: 'assigned'
        };
        break;
    }

    // Обновляем заказ с информацией о доставке
    const updatedOrder = await prisma.order.update({
      where: { id: Number(orderId) },
      data: {
        status: 'SHIPPED',
        trackingNumber: trackingNumber,
      },
      include: { items: true }
    });

    // Отправляем email с трекинг-номером
    try {
      await sendEmail({
        to: order.email,
        subject: `Ваш заказ отправлен — Трекинг #${trackingNumber}`,
        html: emailTemplates.shippingNotification(updatedOrder, trackingNumber)
      });
      console.log('Shipping notification email sent for order:', orderId);
    } catch (emailError) {
      console.error('Failed to send shipping email:', emailError);
    }

    return NextResponse.json({
      success: true,
      orderId: updatedOrder.id,
      trackingNumber,
      carrier,
      carrierData
    });
  } catch (e) {
    console.error('Shipping creation error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Shipping creation failed' },
      { status: 500 }
    );
  }
}

// GET - получить статус доставки
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
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

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      trackingNumber: order.trackingNumber,
      deliveryMethod: order.deliveryMethod,
      deliveryCost: order.deliveryCost,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  } catch (e) {
    console.error('Shipping status error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to get shipping status' },
      { status: 500 }
    );
  }
}
