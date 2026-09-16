import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { adminLog } from "@/lib/adminLog";

async function update(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { id } = await params;
    const categoryId = Number(id);
    const b = await req.json();
    const name = typeof b.name === "string" ? b.name.trim() : "";
    const slug = typeof b.slug === "string" ? b.slug.trim() : "";
    if (!name) return NextResponse.json({ error: "Укажите название категории" }, { status: 400 });

    const exists = await prisma.category.findFirst({
      where: {
        id: { not: categoryId },
        OR: [{ name }, { slug }],
      },
    });
    if (exists) {
      return NextResponse.json({ error: "Категория с таким названием или slug уже существует" }, { status: 400 });
    }

    const cat = await prisma.category.update({
      where: { id: categoryId },
      data: { name, slug: slug || undefined },
    });
    await adminLog(admin, "UPDATE", "category", categoryId, { name: cat.name });
    return NextResponse.json(cat);
  } catch (e: any) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка обновления категории" }, { status: 400 });
  }
}

async function remove(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { id } = await params;
    const categoryId = Number(id);

    const productCount = await prisma.product.count({ where: { categoryId } });
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Нельзя удалить: в категории ${productCount} товар(ов)` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id: categoryId } });
    await adminLog(admin, "DELETE", "category", categoryId);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка удаления категории" }, { status: 400 });
  }
}

export { update as PATCH, update as PUT };
export { remove as DELETE };