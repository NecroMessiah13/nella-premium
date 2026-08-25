import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { id } = await params;
    const b = await req.json();
    const productId = Number(id);

    const p = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id: productId },
        data: {
          name: b.name,
          slug: b.slug,
          description: b.description || null,
          price: Number(b.price),
          color: b.color,
          tone: b.tone,
          badge: b.badge || null,
          source: b.source || null,
          sourceUrl: b.sourceUrl || null,
          categoryId: Number(b.categoryId),
        },
      });

      if (Array.isArray(b.images)) {
        await tx.productImage.deleteMany({ where: { productId } });
        if (b.images.length)
          await tx.productImage.createMany({
            data: b.images.map((url: string, i: number) => ({
              productId,
              url,
              sortOrder: i,
            })),
          });
      }

      if (Array.isArray(b.variants)) {
        for (const v of b.variants) {
          const variantId = Number(v.id);
          
          // Если это числовой id > 0 - обновляем существующий вариант
          if (variantId > 0) {
            await tx.productVariant.update({
              where: { id: variantId },
              data: { stock: Number(v.stock) },
            });
          } else {
            // Если это новый вариант (отрицательный или строковый id) - создаём
            await tx.productVariant.create({
              data: {
                productId,
                sku: v.sku,
                size: v.size,
                color: v.color,
                stock: Number(v.stock),
              },
            });
          }
        }
      }

      return tx.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          variants: true,
          images: { orderBy: { sortOrder: "asc" } },
        },
      });
    });

    return NextResponse.json(p);
  } catch (e) {
    console.error("Update product error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { id } = await params;
    await prisma.product.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 }
    );
  }
}
