import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const now = new Date();

    const [
      orders,
      paidSum,
      users,
      productCount,
      stockAgg,
      categories,
      reviews,
      wishlist,
      views,
    ] = await Promise.all([
      // все заказы (поля для разбивки и тренда)
      prisma.order.findMany({
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          deliveryMethod: true,
          total: true,
          createdAt: true,
        },
      }),
      // сумма оплаченных заказов
      prisma.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { total: true },
      }),
      // пользователи (для новых за период)
      prisma.user.findMany({ select: { createdAt: true }, where: { role: { not: "ADMIN" } } }),
      // число товаров
      prisma.product.count(),
      // суммарный склад
      prisma.productVariant.aggregate({ _sum: { stock: true } }),
      // категории
      prisma.category.count(),
      // отзывы + средний рейтинг
      prisma.review.aggregate({ _count: true, _avg: { rating: true } }),
      // избранное
      prisma.wishlist.count(),
      // просмотры товаров
      prisma.productView.count(),
    ]);

    // --- базовые показатели ---
    const totalOrders = orders.length;
    const paidOrders = orders.filter(o => o.paymentStatus === "PAID");
    const revenue = paidSum._sum?.total || 0;
    const avgOrder = totalOrders ? Math.round(revenue / totalOrders) : 0;
    const paidOrderCount = paidOrders.length;
    const totalStock = stockAgg._sum?.stock || 0;
    const reviewCount = reviews._count;
    const avgRating = reviews._avg?.rating || 0;

    // --- выручка за месяц и за год (только оплаченные) ---
    const sumPaid = (arr: typeof paidOrders, filter: (d: Date) => boolean) =>
      arr.filter(o => filter(new Date(o.createdAt))).reduce((s, o) => s + o.total, 0);
    const revenueMonth = sumPaid(paidOrders, d =>
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
    const revenueYear = sumPaid(paidOrders, d => d.getFullYear() === now.getFullYear());

    // --- новые пользователи/заказы за период ---
    const dayMs = 24 * 60 * 60 * 1000;
    const countSince = (arr: { createdAt: Date }[], days: number) =>
      arr.filter(d => now.getTime() - new Date(d.createdAt).getTime() <= days * dayMs).length;
    const newUsers7 = countSince(users, 7);
    const newUsers30 = countSince(users, 30);
    const newOrders7 = orders.filter(o => now.getTime() - new Date(o.createdAt).getTime() <= 7 * dayMs).length;
    const newOrders30 = orders.filter(o => now.getTime() - new Date(o.createdAt).getTime() <= 30 * dayMs).length;

    // --- разбивка по статусам ---
    const byStatus: Record<string, number> = {};
    const byPayment: Record<string, number> = {};
    const byDelivery: Record<string, number> = {};
    for (const o of orders) {
      byStatus[o.status] = (byStatus[o.status] || 0) + 1;
      byPayment[o.paymentStatus] = (byPayment[o.paymentStatus] || 0) + 1;
      byDelivery[o.deliveryMethod] = (byDelivery[o.deliveryMethod] || 0) + 1;
    }

    // --- тренд: заказы и выручка по дням (последние 14 дней) ---
    const days: { [k: string]: { date: string; orders: number; revenue: number } } = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * dayMs);
      const key =
        d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      days[key] = { date: key, orders: 0, revenue: 0 };
    }
    for (const o of orders) {
      const d = new Date(o.createdAt);
      const key =
        d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      if (days[key]) {
        days[key].orders += 1;
        if (o.paymentStatus === "PAID") days[key].revenue += o.total;
      }
    }
    const trend = Object.values(days);

    // --- топ продаваемых товаров ---
    const topByItems = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });
    const topProducts = await Promise.all(
      topByItems.map(async t => {
        const prod = await prisma.product.findUnique({
          where: { id: t.productId },
          select: { id: true, name: true, price: true, slug: true, images: { take: 1 } },
        });
        return {
          name: prod?.name || "—",
          quantity: t._sum?.quantity || 0,
          price: prod?.price || 0,
          image: prod?.images?.[0]?.url || null,
        };
      })
    );

    // --- использование скидок ---
    const discountAgg = await prisma.discount.aggregate({
      _sum: { usedCount: true },
    });

    return NextResponse.json({
      users: {
        total: users.length,
        new7: newUsers7,
        new30: newUsers30,
      },
      orders: {
        total: totalOrders,
        new7: newOrders7,
        new30: newOrders30,
        paid: paidOrderCount,
      },
      revenue: {
        total: revenue,
        paid: revenue,
        avgOrder,
        month: revenueMonth,
        year: revenueYear,
      },
      catalog: {
        products: productCount,
        stock: totalStock,
        categories,
        reviews: reviewCount,
        avgRating: Math.round(avgRating * 10) / 10,
        wishlists: wishlist,
        views,
      },
      discounts: { usedCount: discountAgg._sum?.usedCount || 0 },
      byStatus,
      byPayment,
      byDelivery,
      trend,
      topProducts,
    });
  } catch (e) {
    return NextResponse.json({ error: "Ошибка загрузки статистики" }, { status: 500 });
  }
}