import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerLog } from "@/lib/customerLog";

export async function PATCH(r: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const u = await requireUser();
    const id = Number((await params).id);
    if (!id) return NextResponse.json({ error: "Некорректный id" }, { status: 400 });

    const existing = await prisma.address.findFirst({ where: { id, userId: u.id } });
    if (!existing)
      return NextResponse.json({ error: "Адрес не найден" }, { status: 404 });

    const b = await r.json();
    const data: { label?: string; fullText?: string; isDefault?: boolean } = {};

    if (typeof b.fullText === "string") {
      const t = b.fullText.trim();
      if (t.length < 5) return NextResponse.json({ error: "Укажите адрес" }, { status: 400 });
      data.fullText = t;
    }
    if (typeof b.label === "string") data.label = b.label.trim() || "Дом";
    if (b.isDefault === true) {
      await prisma.address.updateMany({ where: { userId: u.id }, data: { isDefault: false } });
      data.isDefault = true;
    } else if (existing.isDefault) {
      data.isDefault = true;
    }

    const address = await prisma.address.update({ where: { id }, data });
    void customerLog({
      userId: u.id,
      email: u.email,
      action: "ADDRESS_UPDATE",
      entity: "address",
      entityId: id,
      details: data,
    });
    return NextResponse.json({ address });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    return NextResponse.json({ error: "Не удалось обновить адрес" }, { status: 500 });
  }
}

export async function DELETE(_r: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const u = await requireUser();
    const id = Number((await params).id);
    if (!id) return NextResponse.json({ error: "Некорректный id" }, { status: 400 });

    const existing = await prisma.address.findFirst({ where: { id, userId: u.id } });
    if (!existing)
      return NextResponse.json({ error: "Адрес не найден" }, { status: 404 });

    const wasDefault = existing.isDefault;
    await prisma.address.delete({ where: { id } });
    void customerLog({
      userId: u.id,
      email: u.email,
      action: "ADDRESS_DELETE",
      entity: "address",
      entityId: id,
      details: { fullText: existing.fullText },
    });

    if (wasDefault) {
      const first = await prisma.address.findFirst({ where: { userId: u.id }, orderBy: { createdAt: "asc" } });
      if (first) await prisma.address.update({ where: { id: first.id }, data: { isDefault: true } });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    return NextResponse.json({ error: "Не удалось удалить адрес" }, { status: 500 });
  }
}