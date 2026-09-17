import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, emailTemplates } from '@/lib/email';
import { verifyWebhookSignature } from '@/lib/yookassa';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // Проверяем подпись от YooKassa, если ключ задан
    const secret = process.env.YOOKASSA_SECRET_KEY;
    if (secret) {
      const signature = request.headers.get('content-signature') || '';
      if (!verifyWebhookSignature(rawBody, signature, secret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    const body = JSON.parse(rawBody);
    if (!body.event) {
      return NextResponse.json({ success: true });
    }

    if (body.event === 'payment.succeeded' || body.event === 'payment.captured') {
      const paymentData = body.object;
      const orderId = paymentData.metadata?.orderId;
      if (!orderId) {
        return NextResponse.json({ success: true });
      }

      // Идемпотентность: уже обработано?
      const order = await prisma.order.findUnique({
        where: { id: Number(orderId) },
        include: { items: true },
      });
      if (!order) {
        return NextResponse.json({ success: true });
      }
      if (order.paymentStatus === 'PAID') {
        return NextResponse.json({ success: true, alreadyProcessed: true });
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'PROCESSING',
          paymentId: paymentData.id,
        },
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

      console.log('Payment successful for order:', orderId, 'paymentId:', paymentData.id);
    } else if (body.event === 'payment.canceled' || body.event === 'payment.failed') {
      const paymentData = body.object;
      const orderId = paymentData.metadata?.orderId;
      if (!orderId) {
        return NextResponse.json({ success: true });
      }

      const order = await prisma.order.findUnique({ where: { id: Number(orderId) } });
      if (!order) {
        return NextResponse.json({ success: true });
      }
      if (order.paymentStatus === 'FAILED' || order.paymentStatus === 'CANCELLED') {
        return NextResponse.json({ success: true, alreadyProcessed: true });
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'FAILED', paymentId: paymentData.id },
      });

      console.log('Payment failed for order:', orderId);
    } else if (body.event === 'refund.succeeded') {
      const refundData = body.object;
      const paymentId = refundData.payment_id;

      const order = await prisma.order.findFirst({ where: { paymentId } });
      if (order) {
        if (order.paymentStatus === 'REFUNDED') {
          return NextResponse.json({ success: true, alreadyProcessed: true });
        }
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'REFUNDED', status: 'CANCELLED' },
        });
        console.log('Refund processed for order:', order.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Webhook error:', e);
    return NextResponse.json({ success: true });
  }
}
