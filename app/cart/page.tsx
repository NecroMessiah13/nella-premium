'use client';
import Link from 'next/link';
import { useCart } from '@/components/Cart';
import { formatPrice } from '@/lib/products';

export default function CartPage() {
  const { items, total, decrement, removeLine, increment, clear } = useCart();
  const linePrice = (x: { price: number; offerPrice?: number | null }) =>
    x.offerPrice != null && x.offerPrice < x.price ? x.offerPrice : x.price;

  return (
    <main className="cartPage">
      <span className="eyebrow">ВАШ ЗАКАЗ</span>
      <h1>Корзина</h1>
      {items.length === 0 && (
        <Link className="backLink" href="/catalog">← Вернуться в каталог</Link>
      )}
      {!items.length ? (
        <div className="emptyCart">
          <p>Ваша корзина пока пуста.</p>
          <Link className="darkButton" href="/catalog">Перейти в каталог</Link>
        </div>
      ) : (
        <div className="cartLayout">
          <div>
            {items.map(x => (
              <div className="cartRow" key={x.slug + x.size}>
                <div className={'cartRowPhoto ' + x.tone}>НЕЛЛА</div>
                <div>
                  <h3>{x.name}</h3>
                  <p>{x.color} · размер {x.size}</p>
                  <div className="qtyStepper">
                    <button onClick={() => decrement(x.slug, x.size)} aria-label="Уменьшить">−</button>
                    <span>{x.qty}</span>
                    <button onClick={() => increment(x.slug, x.size)} aria-label="Увеличить">+</button>
                  </div>
                  <button className="removeLine" onClick={() => removeLine(x.slug, x.size)}>Удалить</button>
                </div>
                <strong>{formatPrice(linePrice(x) * x.qty)}</strong>
              </div>
            ))}
          </div>
          <aside className="summary">
            <h2>Итого</h2>
            <div><span>Товары</span><b>{formatPrice(total)}</b></div>
            <div><span>Доставка</span><b>Бесплатно</b></div>
            <button className="darkButton fullButton" onClick={() => window.location.href = '/checkout'}>Оформить заказ</button>
            <Link className="lightButton fullButton" href="/catalog" style={{ display: 'block', textAlign: 'center', marginTop: '10px', textDecoration: 'none' }}>Продолжить покупки</Link>
            <button className="clearCart" onClick={clear} style={{ border: 0, background: 'none', color: '#999', cursor: 'pointer', marginTop: '10px', textDecoration: 'underline', fontSize: '12px' }}>Очистить корзину</button>
          </aside>
        </div>
      )}
    </main>
  );
}