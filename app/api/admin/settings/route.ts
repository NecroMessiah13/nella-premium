import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { adminLog } from "@/lib/adminLog";
import { HERO_DEFAULTS, HERO_KEYS, heroFromRows } from "@/lib/hero";

export async function GET() {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const rows = await prisma.siteSetting.findMany();
  return NextResponse.json(heroFromRows(rows));
}

export async function PUT(r: Request) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const b = await r.json();
    const changes = Object.keys(b).filter((k) => HERO_KEYS.includes(k));
    if (!changes.length)
      return NextResponse.json({ error: "Нет полей для сохранения" }, { status: 400 });

    for (const k of changes) {
      const val = typeof b[k] === "string" ? b[k].trim() : "";
      await prisma.siteSetting.upsert({ where: { key: k }, update: { value: val }, create: { key: k, value: val } });
    }
    const rows = await prisma.siteSetting.findMany();
    await adminLog(admin, "UPDATE", "settings", null, { changed: changes });
    return NextResponse.json(heroFromRows(rows));
  } catch (e: any) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка сохранения настроек" }, { status: 400 });
  }
}