import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const COLLECTION_MAP: { slug: string; name: string }[] = [
  { slug: 'dresses', name: 'Платья' },
  { slug: 'jumpers', name: 'Джемперы' },
  { slug: 'skirts', name: 'Юбки' },
  { slug: 'pants', name: 'Брюки' },
  { slug: 'homewear', name: 'Костюмы и пижамы' },
];

async function main() {
  for (const m of COLLECTION_MAP) {
    const cat = await db.category.findUnique({ where: { slug: m.slug }, include: { products: { include: { images: { orderBy: { sortOrder: 'asc' as const } } } } } });
    if (!cat) { console.log('no category', m.slug); continue; }

    const products = cat.products;
    if (!products.length) { console.log('no products for cat', m.slug); continue; }

    const firstImg = products[0].images[0]?.url ?? null;

    let collection = await db.collection.findUnique({ where: { slug: m.slug } });
    if (!collection) {
      collection = await db.collection.create({
        data: { name: m.name, slug: m.slug, description: `Новая коллекция ${m.name.toLowerCase()}`, image: firstImg, sortOrder: 10, active: true },
      });
      console.log('created collection:', m.name, 'slug', m.slug);
    } else {
      await db.collection.update({ where: { id: collection.id }, data: { name: m.name, image: firstImg, active: true } });
      console.log('updated collection:', m.name);
    }

    let linked = 0;
    for (const p of products) {
      const exists = await db.collectionProduct.findUnique({ where: { collectionId_productId: { collectionId: collection.id, productId: p.id } } });
      if (!exists) { await db.collectionProduct.create({ data: { collectionId: collection.id, productId: p.id } }); linked++; }
    }
    console.log(`  linked ${linked} new / ${products.length} total products -> ${m.name}`);
  }
  console.log('DONE collections');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
