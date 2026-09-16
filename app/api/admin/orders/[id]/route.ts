import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { adminLog } from "@/lib/adminLog";
import { sendEmail, emailTemplates } from "@/lib/email";
import { generateTrackingNumber } from "@/lib/tracking";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { id } = await params;
    const b = await req.json();

    const before = await prisma.order.findUnique({ where: { id: Number(id) }, include: { items: true } });
    if (!before) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });

    const data: any = {};
    if (b.status) data.status = b.status;
    if (typeof b.trackingNumber === "string") data.trackingNumber = b.trackingNumber || null;

    // Автогенерация трек-номера при переходе в «Отправлен», если его ещё нет
    if (b.status === "SHIPPED" && !data.trackingNumber && !before.trackingNumber) {
      data.trackingNumber = generateTrackingNumber(before.deliveryMethod);
    }

    const o = await prisma.order.update({
      where: { id: Number(id) },
      data,
      include: { items: true },
    });

    // Автоматические письма при смене статуса
    if (b.status && b.status !== before.status) {
      const page = (n: number) => n / 100;
      const total = o.total;

      if (b.status === "SHIPPED") {
        const tracking = o.trackingNumber || b.trackingNumber;
        sendEmail({
          to: o.email,
          subject: `Заказ #${o.id} отправлен — трек-номер ${tracking || "будет позже"}`,
          html: emailTemplates.shippingNotification(
            { ...o, total },
            tracking || "трек-номер уточнится в ближайшее время"
          ),
        }).catch((e: any) => console.error("tracking email error:", e));
      }

      if (b.status === "DELIVERED") {
        sendEmail({
          to: o.email,
          subject: `Заказ #${o.id} доставлен — Nella Premium`,
          html: emailTemplates.deliveryConfirmation({ ...o, total }),
        }).catch((e: any) => console.error("delivery email error:", e));
      }
    }

    await adminLog(admin, "UPDATE", "order", o.id, {
      status: o.status,
      trackingNumber: o.trackingNumber,
      changed: Object.keys(data).filter(k => true),
    });

    return NextResponse.json(o);
  } catch (e: any) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { id } = await params;
    await prisma.order.delete({ where: { id: Number(id) } });
    await adminLog(admin, "DELETE", "order", id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка" }, { status: 400 });
  }
}