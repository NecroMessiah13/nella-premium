'use client';
import Link from 'next/link';
import { useRef } from 'react';
import { ProductCard } from './ProductCard';

export function NewArrivals({ products }: { products: any[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollThumbs = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]') as HTMLElement | null;
    const step = card ? card.offsetWidth + 22 : 260;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section className="newSection" id="new">
      <div className="sectionTop">
        <div>
          <span className="eyebrow">НОВОЕ</span>
          <h2>Новинки</h2>
        </div>
        <div className="newNav">
          <button className="carouselBtn" aria-label="Назад" onClick={() => scrollThumbs(-1)}>‹</button>
          <Link href="/catalog" className="newAll">Смотреть все →</Link>
          <button className="carouselBtn" aria-label="Вперёд" onClick={() => scrollThumbs(1)}>›</button>
        </div>
      </div>

      <div className="newTrack" ref={trackRef}>
        {products.map(p => (
          <div className="newTrackItem" data-card key={p.id}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
