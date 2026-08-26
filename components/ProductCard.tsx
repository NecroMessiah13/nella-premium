"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Product, formatPrice } from "@/lib/products";
import { useCart } from "./Cart";

export function ProductCard({product}:{product:Product}) {
  const {add}=useCart();
  const image = product.images?.[0]?.url;
  const [inWishlist, setInWishlist] = useState(false);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [selectedSize, setSelectedSize] = useState('M');

  useEffect(() => {
    // Проверяем localStorage для wishlist
    const wishlist = JSON.parse(localStorage.getItem('nella_wishlist') || '[]');
    setInWishlist(wishlist.includes(product.id));
  }, [product.id]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    const wishlist = JSON.parse(localStorage.getItem('nella_wishlist') || '[]');
    
    if (inWishlist) {
      const updated = wishlist.filter((id: number) => id !== product.id);
      localStorage.setItem('nella_wishlist', JSON.stringify(updated));
    } else {
      wishlist.push(product.id);
      localStorage.setItem('nella_wishlist', JSON.stringify(wishlist));
    }
    
    setInWishlist(!inWishlist);
  };

  const handleAddToCart = () => {
    setShowSizeSelector(true);
  };

  const handleSizeSelect = (size: string) => {
    add(product, size);
    setShowSizeSelector(false);
  };

  if (showSizeSelector) {
    return <article className="productCard">
      <div className="sizeSelector" onClick={() => setShowSizeSelector(false)}>
        <div className="sizePanel" onClick={(e) => e.stopPropagation()}>
        <p style={{marginBottom: '12px', fontWeight: 500}}>Выберите размер</p>
        <div className="sizes" style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '12px'}}>
          {['XS','S','M','L','XL'].map(s => {
            const hasStock = product.variants?.find(v => v.size === s);
            return (
              <button 
                key={s}
                onClick={() => handleSizeSelect(s)}
                disabled={!hasStock}
                className={`sizeBtn ${selectedSize === s ? 'selected' : ''}`}
                style={{
                  padding: '8px',
                  border: `1px solid ${selectedSize === s ? '#000' : '#ddd'}`,
                  background: selectedSize === s ? '#000' : '#fff',
                  color: selectedSize === s ? '#fff' : '#000',
                  cursor: hasStock ? 'pointer' : 'not-allowed',
                  opacity: hasStock ? 1 : 0.5,
                  fontSize: '12px',
                  fontWeight: 500
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
        <button 
          onClick={() => setShowSizeSelector(false)}
          style={{width: '100%', padding: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer'}}
        >
          Отмена
        </button>
        </div>
      </div>
    </article>
  }

  return <article className="productCard">
    <Link href={`/product/${product.slug}`} className={`productPhoto ${product.tone}`}>
      {product.badge && <span className="badge">{product.badge}</span>}
      <button className={`heart ${inWishlist ? 'active' : ''}`} onClick={toggleWishlist}>♡</button>
      {image ? (
        <img src={image} alt={product.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      ) : (
        <span className="photoWord">НЕЛЛА</span>
      )}
    </Link>
    <div className="productMeta">
      <div><Link href={`/product/${product.slug}`}><h3>{product.name}</h3></Link><span>{product.color}</span></div>
      <div className="price">{formatPrice(product.price)}</div>
    </div>
    <button className="quickAdd" onClick={handleAddToCart}>Добавить в корзину</button>
  </article>
}
