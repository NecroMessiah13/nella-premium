'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Получаем параметры из URL
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get('paymentId');

    // Проверяем статус платежа (в реальном приложении это будет webhook)
    if (paymentId) {
      // TODO: Проверить статус платежа через API
      setOrderData({ paymentId, success: true });
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <main style={{ padding: '100px 20px', textAlign: 'center' }}>
        <p>Проверка статуса платежа...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: '100px 20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>✓ Платёж прошёл успешно!</h1>
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
        Спасибо за покупку. Вскоре вы получите письмо с подробной информацией о вашем заказе и доставке.
      </p>
      
      <div style={{ 
        background: '#f5f5f5', 
        padding: '30px', 
        borderRadius: '8px', 
        maxWidth: '500px', 
        margin: '30px auto',
        textAlign: 'left'
      }}>
        <p><b>Что дальше:</b></p>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
          <li>Проверьте ваш email для подтверждения заказа</li>
          <li>Отследите доставку в личном кабинете</li>
          <li>Товар будет доставлен в течение указанного срока</li>
          <li>У вас есть 14 дней на возврат</li>
        </ul>
      </div>

      <div style={{ marginTop: '40px' }}>
        <Link href="/" style={{
          display: 'inline-block',
          background: '#000',
          color: '#fff',
          padding: '15px 30px',
          textDecoration: 'none',
          borderRadius: '4px',
          marginRight: '15px'
        }}>
          На главную
        </Link>
        <Link href="/catalog" style={{
          display: 'inline-block',
          background: '#fff',
          color: '#000',
          padding: '15px 30px',
          textDecoration: 'none',
          borderRadius: '4px',
          border: '1px solid #ddd'
        }}>
          Продолжить покупки
        </Link>
      </div>
    </main>
  );
}
