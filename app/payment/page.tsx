'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Обработка платежа...');

  useEffect(() => {
    // Получаем параметры из URL
    const success = searchParams.get('success');
    const orderId = searchParams.get('orderId');
    
    // Имитируем проверку статуса платежа
    const timer = setTimeout(() => {
      if (success === 'true' || orderId) {
        setStatus('success');
        setMessage('Платёж успешно принят!');
      } else {
        setStatus('failed');
        setMessage('Ошибка при обработке платежа');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchParams]);

  if (status === 'processing') {
    return (
      <main style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h1>Обработка платежа...</h1>
        <p>Пожалуйста, подождите</p>
        <div style={{ marginTop: '30px' }}>
          <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    );
  }

  if (status === 'success') {
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

  return (
    <main style={{ padding: '100px 20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px', color: '#e74c3c' }}>✗ Платёж не прошёл</h1>
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
        {message}
      </p>

      <div style={{ marginTop: '40px' }}>
        <Link href="/checkout" style={{
          display: 'inline-block',
          background: '#000',
          color: '#fff',
          padding: '15px 30px',
          textDecoration: 'none',
          borderRadius: '4px',
          marginRight: '15px'
        }}>
          Повторить попытку
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

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <main style={{ padding: '100px 20px', textAlign: 'center' }}>
        <p>Загрузка...</p>
      </main>
    }>
      <PaymentContent />
    </Suspense>
  );
}
