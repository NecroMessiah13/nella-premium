import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { adminLog } from "@/lib/adminLog";

export async function GET() {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const cats = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json(cats);
}

export async function POST(r: Request) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const b = await r.json();
    const name = typeof b.name === "string" ? b.name.trim() : "";
    let slug = typeof b.slug === "string" ? b.slug.trim() : "";
    if (!name) return NextResponse.json({ error: "Укажите название категории" }, { status: 400 });

    // auto-generate slug if empty
    if (!slug) {
      slug = name.toLowerCase()
        .replace(/[^a-zа-яё0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "");
    }
    if (!slug) return NextResponse.json({ error: "Некорректный slug" }, { status: 400 });

    const exists = await prisma.category.findFirst({ where: { OR: [{ name }, { slug }] } });
    if (exists) {
      return NextResponse.json({ error: "Категория с таким названием или slug уже существует" }, { status: 400 });
    }

    const cat = await prisma.category.create({ data: { name, slug } });
    await adminLog(admin, "CREATE", "category", cat.id, { name: cat.name });
    return NextResponse.json(cat, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка создания категории" }, { status: 400 });
  }
}