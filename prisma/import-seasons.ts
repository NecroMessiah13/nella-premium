import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const SEASONS = [
  { slug: 'autumn-2026', name: 'Осень 2026', description: 'Новая коллекция осени 2026 — платья, джемперы, брюки и юбки из натуральных тканей.', sortOrder: 1 },
  { slug: 'home-autumn-2026', name: 'Осень 2026 · Дом', description: 'Домашняя коллекция — уютные пижамы и костюмы для дома.', sortOrder: 2 },
];

const CAT_MAP: Record<string, string> = {
  pants: 'autumn-2026',
  skirts: 'autumn-2026',
  jumpers: 'autumn-2026',
  dresses: 'autumn-2026',
  homewear: 'home-autumn-2026',
};

async function main() {
  // 1. Деактивируем все существующие коллекции (категорийные/тестовые)
  const all = await db.collection.findMany();
  for (const c of all) {
    if (c.active) {
      await db.collection.update({ where: { id: c.id }, data: { active: false } });
      console.log('deactivated:', c.name, c.slug);
    }
  }

  // 2. Создаём/обновляем сезонные коллекции и привязываем товары по категориям
  for (const s of SEASONS) {
    let col = await db.collection.findUnique({ where: { slug: s.slug } });
    const img = await getSeasonImage(s.slug);
    if (!col) {
      col = await db.collection.create({ data: { name: s.name, slug: s.slug, description: s.description, image: img, sortOrder: s.sortOrder, active: true } });
      console.log('created season:', s.name);
    } else {
      col = await db.collection.update({ where: { id: col.id }, data: { name: s.name, description: s.description, image: img, sortOrder: s.sortOrder, active: true } });
      console.log('updated season:', s.name);
    }
    await db.collectionProduct.deleteMany({ where: { collectionId: col.id } });
    let n = 0;
    for (const [catSlug, seasonSlug] of Object.entries(CAT_MAP)) {
      if (seasonSlug !== s.slug) continue;
      const cat = await db.category.findUnique({ where: { slug: catSlug }, include: { products: true } });
      if (!cat) continue;
      for (const p of cat.products) {
        await db.collectionProduct.upsert({
          where: { collectionId_productId: { collectionId: col.id, productId: p.id } },
          update: {},
          create: { collectionId: col.id, productId: p.id },
        });
        n++;
      }
    }
    console.log(`  -> ${n} products linked to "${s.name}"`);
  }
  console.log('DONE seasons');
}

async function getSeasonImage(seasonSlug: string): Promise<string | null> {
  const fallbackCats = seasonSlug === 'home-autumn-2026' ? ['homewear'] : ['dresses', 'jumpers', 'pants', 'skirts'];
  for (const cs of fallbackCats) {
    const cat = await db.category.findUnique({ where: { slug: cs }, include: { products: { include: { images: { orderBy: { sortOrder: 'asc' as const } } } } } });
    if (cat && cat.products.length && cat.products[0].images.length) return cat.products[0].images[0].url;
  }
  return null;
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
