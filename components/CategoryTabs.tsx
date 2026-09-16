'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ProductCard } from './ProductCard';

export function CategoryTabs({ categories }: { categories: any[] }) {
  const [activeSlug, setActiveSlug] = useState(categories[0]?.slug || '');
  const tabsRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const activeCat = categories.find(c => c.slug === activeSlug) || categories[0];

  const scrollTabs = (dir: number) => {
    const el = tabsRef.current;
    if (!el) return;
    const chip = el.querySelector('.catTab') as HTMLElement | null;
    const step = chip ? chip.offsetWidth + 10 : 200;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  const showTab = (slug: string) => {
    setActiveSlug(slug);
    trackRef.current?.scrollTo({ left: 0 });
  };

  const scrollProducts = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]') as HTMLElement | null;
    const step = card ? card.offsetWidth + 22 : 260;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  if (!categories.length) return null;

  return (
    <section className="catTabsSection" id="category-tabs">
      <div className="sectionTop">
        <div>
          <span className="eyebrow">ТОВАРЫ</span>
          <h2>Товары</h2>
        </div>
        <div className="newNav">
          <button className="carouselBtn" aria-label="Назад" onClick={() => scrollTabs(-1)}>‹</button>
          <button className="carouselBtn" aria-label="Вперёд" onClick={() => scrollTabs(1)}>›</button>
        </div>
      </div>

      <div className="catTabs" ref={tabsRef}>
        {categories.map(c => (
          <button
            key={c.slug}
            className={`catTab ${c.slug === activeCat.slug ? 'active' : ''}`}
            onClick={() => showTab(c.slug)}
          >
            {c.name}
            <span className="catTabCount">{c.products.length}</span>
          </button>
        ))}
      </div>

      <div className="catTrackWrap">
        <button className="carouselBtn catTrackArrow left" aria-label="Товары назад" onClick={() => scrollProducts(-1)}>‹</button>
        <div className="catTabTrack" ref={trackRef}>
          {activeCat.products.map(p => (
            <div className="newTrackItem" data-card key={p.id}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
        <button className="carouselBtn catTrackArrow right" aria-label="Товары вперёд" onClick={() => scrollProducts(1)}>›</button>
      </div>
      <p className="catTabMore">
        <Link href={`/catalog?category=${activeCat.slug}`}>Смотреть все в категории →</Link>
      </p>
    </section>
  );
}