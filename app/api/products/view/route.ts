import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateGuestId } from "@/lib/auth";
import { customerLog } from "@/lib/customerLog";

export async function POST(req: Request) {
  try {
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: "productId required" },
        { status: 400 }
      );
    }

    const guestId = await getOrCreateGuestId();

    // Проверить что товар существует
    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Записать просмотр
    await prisma.productView.create({
      data: {
        productId: Number(productId),
        guestId: guestId,
        viewedAt: new Date(),
      },
    });

    void customerLog({
      action: "PRODUCT_VIEW",
      entity: "product",
      entityId: productId,
      details: { name: product.name, slug: product.slug },
      withGuest: true,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error logging view:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
