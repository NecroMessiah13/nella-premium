import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const data = [
  ['linen-01', 'Платье LINEN 01', 'Платья', 'Молочный', 12900, 'linen', 'NEW'],
  ['cotton-02', 'Рубашка COTTON 02', 'Рубашки', 'Бежевый', 7900, 'sand', 'NEW'],
  ['straight-03', 'Брюки STRAIGHT 03', 'Брюки', 'Чёрный', 8900, 'black', null],
  ['silk-01', 'Платье SILK 01', 'Платья', 'Графит', 13900, 'graphite', 'NEW'],
  ['basic-01', 'Костюм BASIC 01', 'Костюмы', 'Капучино', 15900, 'camel', null],
  ['fit-01', 'Футболка FIT 01', 'Футболки', 'Белый', 3900, 'white', null],
  ['soft-01', 'Жакет SOFT 01', 'Верхняя одежда', 'Мокко', 14900, 'mocha', null],
  ['midi-02', 'Платье MIDI 02', 'Платья', 'Шоколад', 11900, 'brown', null],
] as const;

const cats = {
  'Платья': 'dresses',
  'Рубашки': 'shirts',
  'Брюки': 'pants',
  'Костюмы': 'suits',
  'Футболки': 'tshirts',
  'Верхняя одежда': 'outerwear',
} as Record<string, string>;

// Стабильные Unsplash URL через imgix
const imageUrls = [
  'https://images.unsplash.com/photo-1595777712802-4e114016a822?w=500&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1617622414906-a67ce7a27f8e?w=500&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1587025591417-f8cef73beeb9?w=500&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539533057440-7814a9d4f6d9?w=500&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1598807294839-e4eab516cb39?w=500&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1495385794356-15371f348c11?w=500&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506629082632-422fcad1d89e?w=500&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500313313223-8699b680f306?w=500&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1503341338985-b7152e3c3dbf?w=500&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1515563141207-6811510665d8?w=500&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506215316996-61b5c6a2a506?w=500&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1488462237308-ecaa28b729d7?w=500&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1548883329-c48246525252?w=500&h=600&fit=crop&q=80',
];

async function main() {
  // Create admin user
  const bcrypt = require('bcryptjs');
  const adminEmail = 'admin@nella.local';
  const adminPassword = 'admin123';
  
  await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: 'ADMIN',
    },
  });

  // Create categories
  for (const name of Object.keys(cats)) {
    await db.category.upsert({
      where: { slug: cats[name] },
      update: { name },
      create: { name, slug: cats[name] },
    });
  }

  // Create products
  const products: any[] = [];
  for (let i = 0; i < data.length; i++) {
    const [slug, name, catName, color, price, tone, badge] = data[i];
    const category = await db.category.findUniqueOrThrow({
      where: { name: catName as string },
    });

    const product = await db.product.upsert({
      where: { slug: slug as string },
      update: {
        name: name as string,
        color: color as string,
        price: price as number,
        tone: tone as string,
        badge: badge as string | null,
        categoryId: category.id,
        description: 'Модель из коллекции Nella Premium. Свободный силуэт, аккуратная обработка деталей и комфортная посадка.',
      },
      create: {
        slug: slug as string,
        name: name as string,
        color: color as string,
        price: price as number,
        tone: tone as string,
        badge: badge as string | null,
        categoryId: category.id,
        description: 'Модель из коллекции Nella Premium. Свободный силуэт, аккуратная обработка деталей и комфортная посадка.',
      },
    });

    products.push(product);

    // Create variants
    await db.productVariant.deleteMany({
      where: { productId: product.id },
    });

    for (const size of ['XS', 'S', 'M', 'L', 'XL']) {
      await db.productVariant.create({
        data: {
          productId: product.id,
          sku: `${slug.toUpperCase()}-${size}`,
          size,
          color: color as string,
          stock: size === 'XL' ? 2 : 8,
        },
      });
    }

    // Add product images
    await db.productImage.deleteMany({
      where: { productId: product.id },
    });

    for (let j = 0; j < 3; j++) {
      const imageIndex = (i * 3 + j) % imageUrls.length;
      await db.productImage.create({
        data: {
          productId: product.id,
          url: `${imageUrls[imageIndex]}&pid=${product.id}&v=${j}`,
          alt: `${name} - вид ${j + 1}`,
          sortOrder: j,
        },
      });
    }
  }

  // Create collections
  const collection1 = await db.collection.upsert({
    where: { slug: 'new-arrivals' },
    update: {
      name: 'Новые поступления',
      description: 'Свежие модели этого сезона',
      image: imageUrls[0],
      sortOrder: 0,
      active: true,
    },
    create: {
      name: 'Новые поступления',
      slug: 'new-arrivals',
      description: 'Свежие модели этого сезона',
      image: imageUrls[0],
      sortOrder: 0,
      active: true,
    },
  });

  const collection2 = await db.collection.upsert({
    where: { slug: 'dresses' },
    update: {
      name: 'Платья',
      description: 'Элегантные платья для любого случая',
      image: imageUrls[1],
      sortOrder: 1,
      active: true,
    },
    create: {
      name: 'Платья',
      slug: 'dresses',
      description: 'Элегантные платья для любого случая',
      image: imageUrls[1],
      sortOrder: 1,
      active: true,
    },
  });

  const collection3 = await db.collection.upsert({
    where: { slug: 'basics' },
    update: {
      name: 'Базовые вещи',
      description: 'Универсальные вещи на каждый день',
      image: imageUrls[2],
      sortOrder: 2,
      active: true,
    },
    create: {
      name: 'Базовые вещи',
      slug: 'basics',
      description: 'Универсальные вещи на каждый день',
      image: imageUrls[2],
      sortOrder: 2,
      active: true,
    },
  });

  // Add products to collections
  await db.collectionProduct.deleteMany({
    where: { collectionId: collection1.id },
  });

  for (const product of products.slice(0, 3)) {
    await db.collectionProduct.create({
      data: {
        collectionId: collection1.id,
        productId: product.id,
      },
    });
  }

  // Платья в коллекцию
  await db.collectionProduct.deleteMany({
    where: { collectionId: collection2.id },
  });

  for (const product of products.filter((p: any) => p.slug.includes('linen') || p.slug.includes('silk') || p.slug.includes('midi'))) {
    await db.collectionProduct.create({
      data: {
        collectionId: collection2.id,
        productId: product.id,
      },
    });
  }

  // Базовые вещи
  await db.collectionProduct.deleteMany({
    where: { collectionId: collection3.id },
  });

  for (const product of products.filter((p: any) => p.slug.includes('cotton') || p.slug.includes('fit'))) {
    await db.collectionProduct.create({
      data: {
        collectionId: collection3.id,
        productId: product.id,
      },
    });
  }

  // Create discounts
  await db.discount.deleteMany({});

  // Скидка 15% на всю коллекцию платьев
  await db.discount.create({
    data: {
      code: 'DRESSES15',
      description: 'Скидка 15% на все платья',
      type: 'PERCENT',
      value: 15,
      active: true,
      maxUses: 100,
      collectionId: collection2.id,
      startsAt: new Date('2025-01-01'),
      expiresAt: new Date('2025-12-31'),
    },
  });

  // Скидка 300₽ на товар
  await db.discount.create({
    data: {
      code: 'FIRST300',
      description: '300₽ скидка на первый заказ',
      type: 'FIXED',
      value: 300,
      active: true,
      maxUses: 50,
      startsAt: new Date('2025-01-01'),
      expiresAt: new Date('2025-03-31'),
    },
  });

  // Скидка 20% на конкретный товар
  const firstProduct = products[0];
  await db.discount.create({
    data: {
      code: 'LINEN20',
      description: 'Скидка 20% на платье LINEN 01',
      type: 'PERCENT',
      value: 20,
      active: true,
      productId: firstProduct.id,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Seed completed: 8 products + 3 collections + 3 discounts');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
