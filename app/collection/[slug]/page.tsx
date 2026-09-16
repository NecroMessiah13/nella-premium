import Link from 'next/link';
import {prisma} from '@/lib/prisma';
import {ProductCard} from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

export default async function CollectionPage({params}:{params:Promise<{slug:string}>}){
  const {slug} = await params;
  const collection = await prisma.collection.findFirst({
    where: {slug, active: true},
    include: {products: {include: {product: {include: {category: true, variants: true, images: true}}}}}
  });

  if(!collection) return (
    <main className="catalogPage">
      <div className="catalogTitle">
        <span className="eyebrow">КОЛЛЕКЦИЯ</span>
        <h1>Коллекция не найдена</h1>
        <Link className="backLink" href="/">← На главную</Link>
      </div>
    </main>
  );

  const products = collection.products.map((cp:any)=>{
    const p = cp.product;
    return {...p, category: p.category.name, categorySlug: p.category.slug};
  });

  return (
    <main className="catalogPage">
      <div className="catalogTitle">
        <span className="eyebrow">КОЛЛЕКЦИЯ</span>
        <h1>{collection.name}</h1>
        {collection.description && <p>{collection.description}</p>}
        <Link className="backLink" href="/">← На главную</Link>
      </div>
      <div className="catalogGrid">
        {products.map((x:any)=><ProductCard key={x.id} product={x}/>)}
      </div>
    </main>
  );
}
