import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    // Получить топ просматриваемых товаров
    const viewStats = await prisma.productView.groupBy({
      by: ["productId"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 100,
    });

    // Получить информацию о товарах
    const productIds = viewStats.map((v) => v.productId);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: {
          take: 1,
        },
      },
    });

    // Объединить данные
    const stats = viewStats.map((view) => {
      const product = products.find((p) => p.id === view.productId);
      return {
        productId: view.productId,
        product,
        views: view._count.id,
      };
    });

    // Получить общую статистику
    const totalViews = await prisma.productView.count();
    const uniqueGuests = await prisma.productView.groupBy({
      by: ["guestId"],
    });

    const viewsToday = await prisma.productView.count({
      where: {
        viewedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    const viewsThisWeek = await prisma.productView.count({
      where: {
        viewedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return NextResponse.json({
      stats,
      totalViews,
      uniqueGuests: uniqueGuests.length,
      viewsToday,
      viewsThisWeek,
    });
  } catch (e) {
    console.error("Error fetching view stats:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
