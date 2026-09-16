import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerLog } from "@/lib/customerLog";

export async function PATCH(r: Request) {
  try {
    const u = await requireUser();
    const b = await r.json();
    const current = typeof b.currentPassword === "string" ? b.currentPassword : "";
    const next = typeof b.newPassword === "string" ? b.newPassword : "";

    if (next.length < 6) {
      return NextResponse.json({ error: "Новый пароль должен быть не короче 6 символов" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: u.id } });
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Смена пароля недоступна для этой учётной записи" }, { status: 400 });
    }
    const ok = await bcrypt.compare(current, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Текущий пароль введён неверно" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(next, 12);
    await prisma.user.update({ where: { id: u.id }, data: { passwordHash } });
    void customerLog({
      userId: u.id,
      email: u.email,
      action: "PASSWORD_CHANGE",
      entity: "user",
      entityId: u.id,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "Не удалось изменить пароль" }, { status: 500 });
  }
}