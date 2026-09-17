'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Status = 'loading' | 'paid' | 'failed' | 'pending' | 'error';

export default function PaymentSuccessPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [orderId, setOrderId] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oid = Number(params.get('orderId') || '');
    setOrderId(oid || null);

    // Если нет ID заказа — проверить не можем, но в тестовом режиме
    // редирект всегда идёт с orderId
    if (!oid) {
      setStatus('pending');
      return;
    }

    let attempt = 0;
    const check = async () => {
      try {
        const r = await fetch(`/api/payments/status?orderId=${oid}`);
        const d = await r.json();
        if (!d || d.error) throw new Error(d?.error || 'bad response');
        if (d.paymentStatus === 'PAID' || d.status === 'PROCESSING') { setStatus('paid'); return; }
        if (d.paymentStatus === 'FAILED' || d.paymentStatus === 'CANCELLED') { setStatus('failed'); return; }
        if (attempt < 6) {
          attempt++;
          setTimeout(check, 2000);
          return;
        }
        setStatus('pending');
      } catch {
        if (attempt < 3) {
          attempt++;
          setTimeout(check, 2000);
          return;
        }
        setStatus('error');
      }
    };
    check();
  }, []);

  if (status === 'loading') {
    return (
      <main style={{ padding: '100px 20px', textAlign: 'center' }}>
        <p>Проверка статуса платежа...</p>
      </main>
    );
  }

  if (status === 'paid') {
    return (
      <main style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>✓ Платёж прошёл успешно!</h1>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
          {orderId ? `Заказ #${orderId} подтверждён и передан в обработку.` : 'Спасибо за покупку.'} Вскоре вы получите письмо с подробной информацией о доставке.
        </p>
        <div style={{ background: '#f5f5f5', padding: '30px', borderRadius: '8px', maxWidth: '500px', margin: '30px auto', textAlign: 'left' }}>
          <p><b>Что дальше:</b></p>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>Проверьте email для подтверждения заказа</li>
            <li>Отследите доставку в личном кабинете</li>
            <li>Товар будет доставлен в указанный срок</li>
            <li>У вас есть 14 дней на возврат</li>
          </ul>
        </div>
        <div style={{ marginTop: '40px' }}>
          <Link href="/" style={{ display: 'inline-block', background: '#000', color: '#fff', padding: '15px 30px', textDecoration: 'none', borderRadius: '4px', marginRight: '15px' }}>На главную</Link>
          <Link href="/catalog" style={{ display: 'inline-block', background: '#fff', color: '#000', padding: '15px 30px', textDecoration: 'none', borderRadius: '4px', border: '1px solid #ddd' }}>Продолжить покупки</Link>
        </div>
      </main>
    );
  }

  if (status === 'failed') {
    return (
      <main style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '40px', marginBottom: '20px' }}>✕ Платёж не прошёл</h1>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>К сожалению, оплата заказа не была завершена. Вы можете попробовать снова.</p>
        <Link href="/cart" style={{ display: 'inline-block', background: '#000', color: '#fff', padding: '15px 30px', textDecoration: 'none', borderRadius: '4px' }}>Вернуться к корзине</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: '100px 20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '40px', marginBottom: '20px' }}>Платёж обрабатывается</h1>
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
        Мы проверяем статус вашего платежа. Обычно это занимает несколько минут.
        Вы получите подтверждение на email, как только платёж будет принят.
      </p>
      <Link href="/" style={{ display: 'inline-block', background: '#000', color: '#fff', padding: '15px 30px', textDecoration: 'none', borderRadius: '4px' }}>На главную</Link>
    </main>
  );
}