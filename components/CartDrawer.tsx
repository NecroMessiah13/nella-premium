'use client';
import Link from 'next/link';
import { useCart } from './Cart';
import { formatPrice } from '@/lib/products';

export function CartDrawer() {
  const { items, total, increment, decrement, removeLine, showDrawer, setShowDrawer } = useCart();

  return (
    <>
      <div className={`drawerOverlay ${showDrawer ? 'show' : ''}`} onClick={() => setShowDrawer(false)} />
      <div className={`cartDrawer ${showDrawer ? 'show' : ''}`}>
        <div className="drawerHead">
          <h2>Корзина</h2>
          <button onClick={() => setShowDrawer(false)} style={{minWidth:'44px',minHeight:'44px',display:'flex',alignItems:'center',justifyContent:'center',border:'0',background:'none',fontSize:'20px',cursor:'pointer'}}>✕</button>
        </div>

        <div className="drawerItems">
          {items.length === 0 ? (
            <div className="empty">Корзина пуста</div>
          ) : (
            items.map(item => (
              <div key={`${item.slug}-${item.size}`} className="drawerItem">
                <div className="miniVisual" style={{background: `linear-gradient(145deg, #d5c7b5, #a89279)`}}>
                  {item.images?.[0]?.url ? (
                    <img src={item.images[0].url} alt={item.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  ) : (
                    <span style={{color: '#fff', display: 'grid', placeItems: 'center', width: '100%', height: '100%'}}>
                      {item.tone}
                    </span>
                  )}
                </div>
                <div>
                  <b>{item.name}</b>
                  <small>{item.size} · {item.color}</small>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0'}}>
                    <button onClick={() => decrement(item.slug, item.size)} style={{border: '1px solid #ddd', background: '#fff', width: '36px', height: '36px', lineHeight: '1', cursor: 'pointer', fontSize: '16px'}}>−</button>
                    <span style={{fontSize: '12px'}}>{item.qty}</span>
                    <button onClick={() => increment(item.slug, item.size)} style={{border: '1px solid #ddd', background: '#fff', width: '36px', height: '36px', lineHeight: '1', cursor: 'pointer', fontSize: '16px'}}>+</button>
                  </div>
                  <button
                    onClick={() => removeLine(item.slug, item.size)}
                    style={{border: 0, background: 'none', textDecoration: 'underline', padding: 0, cursor: 'pointer', fontSize: '11px', color: '#999'}}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <>
            <div className="drawerTotal">
              Сумма: <strong>{formatPrice(total)}</strong>
            </div>
            
            <Link 
              href="/checkout" 
              className="darkButton fullButton"
              style={{display: 'block', textAlign: 'center', padding: '15px', marginBottom: '10px', textDecoration: 'none', color: '#fff'}}
              onClick={() => setShowDrawer(false)}
            >
              Оформить заказ
            </Link>
          </>
        )}

        <button 
          className="lightButton fullButton"
          onClick={() => setShowDrawer(false)}
          style={{display: 'block', width: '100%', marginTop: '10px'}}
        >
          Продолжить покупки
        </button>
      </div>
    </>
  );
}
