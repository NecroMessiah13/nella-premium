'use client';
import Link from 'next/link';
import { useRef } from 'react';

export type CollectionItem = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  count: number;
};

export function CollectionsCarousel({ collections }: { collections: CollectionItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: number) => {
    trackRef.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  if (!collections.length) return null;

  return (
    <section className="collectionsSection" id="collections">
      <div className="sectionTop collectionsTop">
        <div>
          <span className="eyebrow">КОЛЛЕКЦИИ</span>
          <h2>Подборки Nella</h2>
        </div>
        <div className="carouselNav">
          <button className="carouselBtn" aria-label="Назад" onClick={() => scrollBy(-1)}>‹</button>
          <button className="carouselBtn" aria-label="Вперёд" onClick={() => scrollBy(1)}>›</button>
        </div>
      </div>

      <div className="collectionsTrack" ref={trackRef}>
        {collections.map((c) => (
          <Link href={`/catalog?collection=${c.slug}`} className="collectionCard" key={c.id}>
            <div
              className="collectionCardPhoto"
              style={c.image ? { backgroundImage: `url(${c.image})` } : undefined}
            >
              {!c.image && <span>НЕЛЛА</span>}
            </div>
            <div className="collectionCardBody">
              <h3>{c.name}</h3>
              {c.description && <p>{c.description}</p>}
              <small>{c.count} товаров</small>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
