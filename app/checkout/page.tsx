'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/Cart';
import { formatPrice } from '@/lib/products';

type SavedAddress = {
  id: number;
  label: string;
  fullText: string;
  isDefault: boolean;
};

type Profile = {
  user?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  addresses?: SavedAddress[];
};

const DELIVERY_METHODS = [
  { id: 'COURIER', name: 'Курьер', cost: 0, desc: 'Бесплатная доставка по России, 1-5 дней' },
  { id: 'PICKUP', name: 'Самовывоз', cost: 0, desc: 'Пункт выдачи в Москве, адрес при заказе' },
  { id: 'MAIL', name: 'Почта России', cost: 300, desc: '5-7 рабочих дней' }
];

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderCreated, setOrderCreated] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [errors, setErrors] = useState<{customerName?: string; email?: string; phone?: string; address?: string}>({});
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    deliveryMethod: 'COURIER'
  });

  const selectedDelivery = DELIVERY_METHODS.find(d => d.id === formData.deliveryMethod) || DELIVERY_METHODS[0];
  const promoDiscount = promoApplied?.discount || 0;
  const totalWithDelivery = total + selectedDelivery.cost - promoDiscount;

  const validate = (d = formData) => {
    const e: {customerName?: string; email?: string; phone?: string; address?: string} = {};
    if (!d.customerName.trim()) e.customerName = 'Укажите имя';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim())) e.email = 'Введите корректный email';
    const phoneDigits = d.phone.replace(/[^\d+]/g, '');
    if (!/^\+?\d{10,15}$/.test(phoneDigits)) e.phone = 'Введите корректный телефон';
    if ((d.deliveryMethod === 'COURIER' || d.deliveryMethod === 'MAIL') && !d.address.trim()) e.address = 'Укажите адрес для доставки';
    return e;
  };

  const isValid = Object.keys(validate()).length === 0;
  const handleField = (k: keyof typeof formData, v: string) => {
    const next = {...formData, [k]: v};
    setFormData(next);
    setErrors(validate(next));
  };

  // Подтягиваем данные авторизованного пользователя
  useEffect(() => {
    let cancelled = false;
    fetch('/api/account')
      .then(async r => (r.ok ? (r.json() as Promise<Profile>) : null))
      .then(d => {
        if (!d || cancelled) return;
        const defaultAddr = d.addresses?.find(a => a.isDefault);
        setSavedAddresses(d.addresses || []);
        setFormData(prev => ({
          ...prev,
          customerName: prev.customerName || d.user?.name || '',
          email: prev.email || d.user?.email || '',
          phone: prev.phone || d.user?.phone || '',
          address: prev.address || defaultAddr?.fullText || '',
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      alert('Корзина пуста');
      return;
    }

    const e2 = validate();
    setErrors(e2);
    if (Object.keys(e2).length > 0) return;

    setLoading(true);

    try {
      const orderItems = items.map(item => ({
        productId: item.id,
        size: item.size,
        color: item.color,
        quantity: item.qty
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          deliveryCost: selectedDelivery.cost,
          promoCode: promoApplied?.code || null,
          items: orderItems
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert('Ошибка: ' + data.error);
        return;
      }

      // Если выбран платёж по карте - переход на YooKassa
      if (paymentMethod === 'card') {
        // TODO: интеграция с YooKassa
        window.location.href = `/api/payments/create?orderId=${data.id}`;
      } else {
        setOrderCreated(data);
        clear();
      }
    } catch (error) {
      alert('Ошибка при оформлении заказа');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const applyPromo = async () => {
    setPromoError('');
    if (!promoInput.trim()) return;
    try {
      const r = await fetch('/api/promocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput.trim(), subtotal: total })
      });
      const d = await r.json();
      if (!r.ok) { setPromoError(d.error || 'Промокод недействителен'); setPromoApplied(null); return; }
      setPromoApplied({ code: d.code, discount: d.discount });
      setPromoInput(d.code);
    } catch {
      setPromoError('Не удалось проверить промокод');
    }
  };

  if (orderCreated) {
    return (
      <main className="checkoutPage">
        <div className="successMessage">
          <h1>✓ Заказ успешно создан!</h1>
          <p>Номер заказа: <b>#{orderCreated.id}</b></p>
          <p>Способ доставки: <b>{selectedDelivery.name}</b></p>
          {selectedDelivery.cost > 0 && <p>Стоимость доставки: <b>{formatPrice(selectedDelivery.cost)}</b></p>}
          <p style={{marginTop: '20px', color: '#999', fontSize: '14px'}}>На указанный email будет отправлена информация о статусе доставки.</p>
          <div style={{ marginTop: '30px' }}>
            <Link href="/" className="darkButton">Вернуться на главную</Link>
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="checkoutPage">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h1>Корзина пуста</h1>
          <p>Добавьте товары перед оформлением заказа</p>
          <Link href="/catalog" className="darkButton">Перейти в каталог</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkoutPage">
      <div className="checkoutContainer">
        <div className="checkoutForm">
          <h1>Оформление заказа</h1>
          
          <form onSubmit={handleSubmit}>
            <fieldset>
              <legend>Информация о доставке</legend>
              
              <label>
                Полное имя *
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => handleField('customerName', e.target.value)}
                  placeholder="Иван Иванов"
                />
                {errors.customerName && <small className="fieldError">{errors.customerName}</small>}
              </label>

              <label>
                Email *
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleField('email', e.target.value)}
                  placeholder="ivan@example.com"
                />
                {errors.email && <small className="fieldError">{errors.email}</small>}
              </label>

              <label>
                Телефон *
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => handleField('phone', e.target.value)}
                  placeholder="+7 999 999 9999"
                />
                {errors.phone && <small className="fieldError">{errors.phone}</small>}
              </label>

              <label>
                {formData.deliveryMethod === 'PICKUP' ? 'Адрес пункта выдачи' : formData.deliveryMethod === 'MAIL' ? 'Индекс и адрес доставки' : 'Адрес доставки'}
                {formData.deliveryMethod !== 'PICKUP' && <span className="reqStar">*</span>}
                {savedAddresses.length > 0 && (
                  <select
                    className="savedAddressSelect"
                    value=""
                    onChange={(e) => {
                      const a = savedAddresses.find(x => x.id === Number(e.target.value));
                      if (a) handleField('address', a.fullText);
                    }}
                  >
                    <option value="" disabled>Выбрать из адресной книги…</option>
                    {savedAddresses.map(a => (
                      <option key={a.id} value={a.id}>{a.label}: {a.fullText}</option>
                    ))}
                  </select>
                )}
                <textarea
                  value={formData.address}
                  onChange={(e) => handleField('address', e.target.value)}
                  placeholder="г. Москва, ул. Примерная, д. 123, кв. 45"
                  rows={3}
                />
                {errors.address && <small className="fieldError">{errors.address}</small>}
              </label>
            </fieldset>

            <fieldset>
              <legend>Способ доставки</legend>
              <div className="deliveryOptions">
                {DELIVERY_METHODS.map(method => (
                  <label key={method.id} className="deliveryOption">
                    <input
                      type="radio"
                      name="delivery"
                      value={method.id}
                      checked={formData.deliveryMethod === method.id}
                      onChange={(e) => handleField('deliveryMethod', e.target.value)}
                    />
                    <div>
                      <b>{method.name}</b>
                      <small>{method.desc}</small>
                      {method.cost > 0 && <small style={{display: 'block', color: '#ff6b6b'}}>{formatPrice(method.cost)}</small>}
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Способ оплаты</legend>
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Карта / Яндекс.Касса
              </label>
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                При получении
              </label>
            </fieldset>

            <fieldset>
              <legend>Промокод</legend>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={promoApplied ? promoApplied.code : promoInput}
                  onChange={e => setPromoInput(e.target.value)}
                  placeholder="Введите промокод"
                />
                {promoApplied ? (
                  <button
                    type="button"
                    className="lightButton"
                    onClick={() => { setPromoApplied(null); setPromoInput(''); }}
                  >
                    Убрать
                  </button>
                ) : (
                  <button type="button" className="darkButton" onClick={applyPromo}>Применить</button>
                )}
              </div>
              {promoError && <small className="fieldError">{promoError}</small>}
              {promoApplied && (
                <small style={{ color: '#2e7d32' }}>
                  Промокод применён: −{formatPrice(promoApplied.discount)}
                </small>
              )}
            </fieldset>

            <button className="darkButton fullButton" disabled={loading || !isValid} title={!isValid ? 'Заполните обязательные поля' : ''}>
              {loading ? 'Обработка...' : `Создать заказ - ${formatPrice(totalWithDelivery)}`}
            </button>
          </form>

          <div className="checkoutInfo">
            <h3>Информация о доставке</h3>
            <ul>
              <li>Бесплатная доставка курьером по России</li>
              <li>Бесплатная примерка в течение 14 дней</li>
              <li>Полная гарантия качества</li>
              <li>Отслеживание заказа в реальном времени</li>
            </ul>
          </div>
        </div>

        <aside className="checkoutSummary">
          <h2>Итого</h2>
          
          <div className="orderItems">
            {items.map(item => {
              const linePrice = item.offerPrice != null && item.offerPrice < item.price ? item.offerPrice : item.price;
              return (
              <div key={`${item.slug}-${item.size}`} className="summaryItem">
                <div>
                  <p><b>{item.name}</b></p>
                  <small>{item.size} · {item.color}</small>
                  <small style={{display: 'block', color: '#999'}}>Кол-во: {item.qty}</small>
                </div>
                <div style={{textAlign: 'right'}}>
                  <p>{formatPrice(linePrice * item.qty)}</p>
                </div>
              </div>
              );
            })}
          </div>

          <div className="summaryTotal">
            <div className="totalRow">
              <span>Товары ({items.reduce((s, i) => s + i.qty, 0)} шт)</span>
              <span>{formatPrice(total)}</span>
            </div>
            {selectedDelivery.cost > 0 && (
              <div className="totalRow">
                <span>Доставка</span>
                <span>{formatPrice(selectedDelivery.cost)}</span>
              </div>
            )}
            {promoApplied && promoApplied.discount > 0 && (
              <div className="totalRow" style={{ color: '#2e7d32' }}>
                <span>Скидка</span>
                <span>−{formatPrice(promoApplied.discount)}</span>
              </div>
            )}
            <div className="totalRow" style={{fontSize: '14px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ddd'}}>
              <b>Итого</b>
              <b>{formatPrice(totalWithDelivery)}</b>
            </div>
          </div>

          <Link href="/catalog" className="lightButton fullButton" style={{display: 'block', textAlign: 'center', marginTop: '15px', textDecoration: 'none'}}>
            ← Продолжить покупки
          </Link>
        </aside>
      </div>
    </main>
  );
}
