import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const u = await requireUser();
    const user = await prisma.user.findUnique({
      where: { id: u.id },
      select: { id: true, email: true, name: true, phone: true, bonusBalance: true, role: true, createdAt: true },
    });
    const orders = await prisma.order.findMany({
      where: { userId: u.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    const wishlistCount = await prisma.wishlist.count({ where: { userId: u.id } });
    const addresses = await prisma.address.findMany({
      where: { userId: u.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ user, orders, wishlistCount, addresses });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "Ошибка загрузки кабинета" }, { status: 500 });
  }
}

export async function PATCH(r: Request) {
  try {
    const u = await requireUser();
    const b = await r.json();
    const data: { name?: string | null; phone?: string | null } = {};
    if (typeof b.name === "string") data.name = b.name.trim() || null;
    if (typeof b.phone === "string") data.phone = b.phone.trim() || null;
    const updated = await prisma.user.update({
      where: { id: u.id },
      data,
      select: { id: true, email: true, name: true, phone: true, bonusBalance: true, role: true },
    });
    return NextResponse.json({ user: updated });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "Не удалось обновить профиль" }, { status: 500 });
  }
}