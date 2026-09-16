'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {Product} from '@/lib/products';
import {ProductCard} from '@/components/ProductCard';

export default function WishlistPage(){
  const[items,setItems]=useState<Product[]>([]),[loading,setLoading]=useState(true);
  useEffect(()=>{
    let cancelled = false;
    (async () => {
      try {
        // Объединяем локальное избранное и сохранённое на сервере
        const localIds: number[] = JSON.parse(localStorage.getItem('nella_wishlist') || '[]');
        let serverIds: number[] = [];
        try {
          const r = await fetch('/api/wishlist');
          if (r.ok) {
            const d = await r.json();
            serverIds = Array.isArray(d.items) ? d.items : [];
          }
        } catch {}
        const ids = Array.from(new Set([...localIds, ...serverIds]));
        if (cancelled) return;
        if (!ids.length) { setItems([]); setLoading(false); return; }
        const all: Product[] = await fetch('/api/products').then(r => r.json()).catch(() => []);
        if (!cancelled) setItems(all.filter(p => ids.includes(p.id)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  },[]);

  return <main className="catalogPage">
    <div className="catalogTitle"><span className="eyebrow">ИЗБРАННОЕ</span><h1>Ваши сохранённые вещи</h1><p>Товары, которые вы добавили в избранное.</p></div>
    {loading?<p>Загрузка...</p>: items.length?<div className="catalogGrid">{items.map(x=>(
      <div key={x.id}><ProductCard product={x}/></div>
    ))}</div>:<div className="emptyCart"><p>В избранном пока пусто.</p><Link className="darkButton" href="/catalog">Перейти в каталог</Link></div>}
  </main>
}