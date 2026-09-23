import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { heroFromRows } from '@/lib/hero';

export const dynamic = 'force-dynamic';
import { ProductCard } from '@/components/ProductCard';
import { CollectionsCarousel } from '@/components/CollectionsCarousel';
import { NewArrivals } from '@/components/NewArrivals';
import { CategoryTabs } from '@/components/CategoryTabs';

export async function generateMetadata() {
  return {
    title: 'Nella Premium — современная женская одежда',
    description: 'Швейный бренд Nella Premium: женская одежда с идеальной посадкой, натуральными тканями и характером. Доставка по России.',
    openGraph: {
      title: 'Nella Premium — современная женская одежда',
      description: 'Швейный бренд Nella Premium: женская одежда с идеальной посадкой, натуральными тканями и характером.',
    },
  };
}
export default async function Home(){const rows=await prisma.product.findMany({include:{category:true,images:{orderBy:{sortOrder:'asc'}},variants:true},orderBy:{createdAt:'desc'},take:10});const products=rows.map(p=>({...p,category:p.category.name,categorySlug:p.category.slug}));const categoryRows=await prisma.category.findMany({where:{products:{some:{}}},orderBy:{name:'asc'},include:{products:{include:{images:{orderBy:{sortOrder:'asc'}},variants:true}}}});const categories=categoryRows.map(c=>({id:c.id,name:c.name,slug:c.slug,products:c.products.map(p=>({...p,category:p.category?.name??c.name,categorySlug:p.category?.slug??c.slug}))}));const collections=await prisma.collection.findMany({where:{active:true},orderBy:{sortOrder:'asc'},include:{products:true}});const collectionsData=collections.map(c=>({id:c.id,name:c.name,slug:c.slug,description:c.description,image:c.image,count:c.products.length}));const settingsRows=await prisma.siteSetting.findMany();const hero=heroFromRows(settingsRows);return <main><section className="hero"><div className="heroCopy"><span className="eyebrow">{hero.eyebrow}</span><h1>{hero.title1}<br/><em>{hero.title2}</em><br/>{hero.title3}</h1><p>{hero.subtitle}</p><Link className="darkButton" href="/catalog">{hero.button}</Link></div></section><NewArrivals products={products} /><CategoryTabs categories={categories} /><CollectionsCarousel collections={collectionsData} /><section className="section" id="about"><div className="aboutGrid"><span className="eyebrow">О БРЕНДЕ</span><div><h2>Мы создаём одежду, которую хочется носить каждый день.</h2><p>Nella Premium — швейный бренд о спокойной уверенности. Мы проектируем вещи, уделяя внимание посадке, ткани и каждой строчке.</p></div></div></section><section className="values" id="delivery">{[
["01","Самовывоз","Пункт выдачи в Георгиевске, бесплатно. Забирайте заказ после готовности."],
["02","Ozon","Доставка Ozon в любой город России. Бесплатно, 1–5 дней."],
["03","Почта России","Отправляем по почтовому индексу в любую точку страны. Бесплатно, 5–7 рабочих дней."],
["04","СДЭК","Доставка СДЭК до пункта выдачи или до двери. Бесплатно, сроки зависят от адреса."]
].map(([n,t,d])=><div key={n}><small>{n}</small><h3>{t}</h3><p>{d}</p></div>)}</section><section className="contacts" id="contacts"><span className="eyebrow">КОНТАКТЫ</span><h2>Свяжитесь с нами</h2><div className="contactsGrid"><div><small>Телефон</small><a href="tel:+79331820414">+7 933 182-04-14</a></div><div><small>Email</small><a href="mailto:hello@nella.premium">hello@nella.premium</a></div></div></section><section className="company" id="company"><div className="companyInner"><img className="companyPhoto" src="https://thumbor.uds.app/unsafe/920x1150//game-prod/549756221772/COMPANY_PHOTO/77f088f3-e6b3-48db-bb8c-a4dd9c2304e5" alt="Nella Premium" loading="lazy"/><span className="eyebrow">О КОМПАНИИ</span><h2>Nella Premium</h2><p>Собственное производство Nella Premium. Мы продаём одежду оптом и в розницу, а также сотрудничаем в создании одежды для вашего бренда — от эскиза до выпуска коллекции под вашим именем.</p><ul className="companyPoints">{["Собственное производство","Продажа одежды оптом и в розницу","Сотрудничество в создании одежды для вашего бренда"].map(x=><li key={x}>{x}</li>)}</ul><div className="companyReqs"><div><small>Индивидуальный предприниматель</small><span>Наумова Нелла Николаевна</span></div><div><small>Юридический адрес</small><span>357820, Россия, Ставропольский край, г. Георгиевск, ул. Котовского, д. 16</span></div><div><small>Магазин</small><span>ул. Калинина, 130, Георгиевск, Ставропольский край, 357827</span></div><div><small>ИНН</small><span>262515338197</span></div><div><small>ОГРНИП</small><span>313265108100188</span></div></div><div className="companyContacts"><div><small>Телефон</small><a href="tel:+79331820414">+7 933 182-04-14</a></div><div><small>Email</small><a href="mailto:hello@nella.premium">hello@nella.premium</a></div></div></div></section></main>}
