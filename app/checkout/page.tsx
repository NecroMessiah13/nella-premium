'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/Cart';
import { formatPrice } from '@/lib/products';

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
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    deliveryMethod: 'COURIER'
  });

  const selectedDelivery = DELIVERY_METHODS.find(d => d.id === formData.deliveryMethod) || DELIVERY_METHODS[0];
  const totalWithDelivery = total + selectedDelivery.cost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      alert('Корзина пуста');
      return;
    }

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
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  placeholder="Иван Иванов"
                />
              </label>

              <label>
                Email *
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="ivan@example.com"
                />
              </label>

              <label>
                Телефон *
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+7 999 999 9999"
                />
              </label>

              <label>
                Адрес доставки
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="г. Москва, ул. Примерная, д. 123, кв. 45"
                  rows={3}
                />
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
                      onChange={(e) => setFormData({...formData, deliveryMethod: e.target.value})}
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

            <button className="darkButton fullButton" disabled={loading}>
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
            {items.map(item => (
              <div key={`${item.slug}-${item.size}`} className="summaryItem">
                <div>
                  <p><b>{item.name}</b></p>
                  <small>{item.size} · {item.color}</small>
                  <small style={{display: 'block', color: '#999'}}>Кол-во: {item.qty}</small>
                </div>
                <div style={{textAlign: 'right'}}>
                  <p>{formatPrice(item.price * item.qty)}</p>
                </div>
              </div>
            ))}
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
