import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        reviews: {
          include: { user: { select: { id: true, email: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    return NextResponse.json({
      productId: product.id,
      rating: product.rating,
      reviewCount: product.reviewCount,
      reviews: product.reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        userEmail: r.user.email.split('@')[0], // Скрываем email
        createdAt: r.createdAt
      }))
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Ошибка' },
      { status: 400 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { rating, comment } = await req.json();

    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Войдите, чтобы оставить отзыв' },
        { status: 401 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Рейтинг должен быть от 1 до 5' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        productId: product.id,
        rating,
        comment: comment || null
      }
    });

    // Обновить рейтинг товара
    const allReviews = await prisma.review.findMany({
      where: { productId: product.id }
    });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.product.update({
      where: { id: product.id },
      data: {
        rating: avgRating,
        reviewCount: allReviews.length
      }
    });

    return NextResponse.json(review, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Ошибка' },
      { status: 400 }
    );
  }
}
