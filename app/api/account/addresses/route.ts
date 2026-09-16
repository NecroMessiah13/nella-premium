import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerLog } from "@/lib/customerLog";

export async function GET() {
  try {
    const u = await requireUser();
    const addresses = await prisma.address.findMany({
      where: { userId: u.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ addresses });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    return NextResponse.json({ error: "Ошибка загрузки адресов" }, { status: 500 });
  }
}

export async function POST(r: Request) {
  try {
    const u = await requireUser();
    const b = await r.json();
    const fullText = typeof b.fullText === "string" ? b.fullText.trim() : "";
    const label = typeof b.label === "string" ? b.label.trim() : "Дом";
    if (fullText.length < 5)
      return NextResponse.json({ error: "Укажите адрес (не короче 5 символов)" }, { status: 400 });

    const isDefault = b.isDefault === true;
    if (isDefault) {
      await prisma.address.updateMany({ where: { userId: u.id }, data: { isDefault: false } });
    }
    const count = await prisma.address.count({ where: { userId: u.id } });
    const address = await prisma.address.create({
      data: { userId: u.id, label, fullText, isDefault: isDefault || count === 0 },
    });
    void customerLog({
      userId: u.id,
      email: u.email,
      action: "ADDRESS_CREATE",
      entity: "address",
      entityId: address.id,
      details: { label, fullText },
    });
    return NextResponse.json({ address }, { status: 201 });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    return NextResponse.json({ error: "Не удалось добавить адрес" }, { status: 500 });
  }
}