'use client';
import {useEffect,useState} from 'react';import {Product} from '@/lib/products';import {ProductCard} from '@/components/ProductCard';
type Cat={id:number;name:string;slug:string;_count:{products:number}};
export default function Catalog(){
  const[p,setP]=useState<Product[]>([]),[cat,setCat]=useState(''),[sort,setSort]=useState('new'),[collection,setCollection]=useState(''),[loading,setLoading]=useState(true),[cats,setCats]=useState<Cat[]>([]),[search,setSearch]=useState('');
  const[input,setInput]=useState('');
  useEffect(()=>{const c=new URLSearchParams(window.location.search).get('collection');if(c)setCollection(c);const s=new URLSearchParams(window.location.search).get('q');if(s)setSearch(s)},[]);
  useEffect(()=>{fetch('/api/categories').then(r=>r.json()).then(list=>setCats(list.filter((x:Cat)=>x._count&&x._count.products>0).sort((a:Cat,b:Cat)=>a.name.localeCompare(b.name,'ru'))))},[]);
  useEffect(()=>{setLoading(true);const deb=setTimeout(()=>{const q=new URLSearchParams();if(cat)q.set('category',cat);if(collection)q.set('collection',collection);if(search)q.set('q',search);q.set('sort',sort);fetch('/api/products?'+q).then(r=>r.json()).then(setP).finally(()=>setLoading(false))},search?250:0);return()=>clearTimeout(deb)},[cat,sort,collection,search]);
  const clearCollection=()=>{setCollection('');window.history.replaceState(null,'','/catalog');};
  return <main className="catalogPage">
    <div className="catalogTitle"><span className="eyebrow">КАТАЛОГ</span><h1>Одежда Nella Premium</h1><p>Современная женская одежда с идеальной посадкой и натуральными тканями.</p></div>
    {collection&&<div className="activeFilter">Коллекция: <b>{collection}</b> <button onClick={clearCollection} aria-label="Сбросить фильтр">✕</button></div>}
    <div className="catalogToolbar"><div className="filters"><button className={cat===''?'active':''} onClick={()=>setCat('')} key="all">Все</button>{cats.map(c=><button className={cat===c.slug?'active':''} onClick={()=>setCat(c.slug)} key={c.slug}>{c.name}</button>)}</div><form className="searchBox" onSubmit={e=>{e.preventDefault();setSearch(input.trim())}}><input className="searchInput" placeholder="Поиск по каталогу…" value={input} onChange={e=>setInput(e.target.value)} aria-label="Поиск"/><button className="searchBtn" type="submit" aria-label="Найти">Поиск</button></form><select value={sort} onChange={e=>setSort(e.target.value)}><option value="new">Сначала новые</option><option value="price">Сначала дешевле</option><option value="priceDesc">Сначала дороже</option></select></div>
    {loading?<p>Загрузка...</p>: p.length? <div className="catalogGrid">{p.map(x=><ProductCard key={x.id} product={x}/>)}</div> : <div className="emptyCart"><p>По вашему запросу ничего не найдено.</p><button className="lightButton" onClick={()=>{setSearch('');setInput('');}}>Сбросить поиск</button></div>}
  </main>
}