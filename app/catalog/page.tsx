'use client';
import {useEffect,useState} from 'react';import {Product} from '@/lib/products';import {ProductCard} from '@/components/ProductCard';
const cats=[['Все',''],['Платья','dresses'],['Рубашки','shirts'],['Брюки','pants'],['Костюмы','suits'],['Футболки','tshirts'],['Верхняя одежда','outerwear']];
export default function Catalog(){
  const[p,setP]=useState<Product[]>([]),[cat,setCat]=useState(''),[sort,setSort]=useState('new'),[collection,setCollection]=useState(''),[loading,setLoading]=useState(true);
  useEffect(()=>{const c=new URLSearchParams(window.location.search).get('collection');if(c)setCollection(c);},[]);
  useEffect(()=>{setLoading(true);const q=new URLSearchParams();if(cat)q.set('category',cat);if(collection)q.set('collection',collection);q.set('sort',sort);fetch('/api/products?'+q).then(r=>r.json()).then(setP).finally(()=>setLoading(false))},[cat,sort,collection]);
  const clearCollection=()=>{setCollection('');window.history.replaceState(null,'','/catalog');};
  return <main className="catalogPage">
    <div className="catalogTitle"><span className="eyebrow">КАТАЛОГ</span><h1>Одежда Nella Premium</h1><p>Товары загружаются из PostgreSQL через backend API.</p></div>
    {collection&&<div className="activeFilter">Коллекция: <b>{collection}</b> <button onClick={clearCollection} aria-label="Сбросить фильтр">✕</button></div>}
    <div className="catalogToolbar"><div className="filters">{cats.map(([n,s])=><button className={cat===s?'active':''} onClick={()=>setCat(s)} key={n}>{n}</button>)}</div><select value={sort} onChange={e=>setSort(e.targetValue)}><option value="new">Сначала новые</option><option value="price">Сначала дешевле</option><option value="priceDesc">Сначала дороже</option></select></div>
    {loading?<p>Загрузка...</p>:<div className="catalogGrid">{p.map(x=><ProductCard key={x.id} product={x}/>)}</div>}
  </main>
}
