'use client';
import { useEffect, useState } from 'react';

interface ViewStats {
  productId: number;
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    images: Array<{ url: string }>;
  };
  views: number;
}

interface Analytics {
  stats: ViewStats[];
  totalViews: number;
  uniqueGuests: number;
  viewsToday: number;
  viewsThisWeek: number;
}

export function AnalyticsTab() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/analytics');
      if (!res.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const data = await res.json();
      setData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Автообновление каждые 5 секунд
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Ошибка: {error}</div>;
  }

  if (!data) {
    return <div style={{ padding: '20px' }}>Загрузка статистики...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>📊 Аналитика просмотров</h2>
        <button 
          onClick={fetchStats}
          disabled={loading}
          style={{
            padding: '8px 16px',
            background: '#1c1b19',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            fontSize: '13px',
            fontWeight: '500'
          }}
        >
          {loading ? 'Загрузка...' : '🔄 Обновить'}
        </button>
      </div>

      {/* Общая статистика */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px',
        }}
      >
        <div
          style={{
            background: '#f5f5f5',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: '#666' }}>Всего просмотров</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{data.totalViews}</div>
        </div>

        <div
          style={{
            background: '#f5f5f5',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: '#666' }}>Уникальных гостей</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{data.uniqueGuests}</div>
        </div>

        <div
          style={{
            background: '#f5f5f5',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: '#666' }}>Просмотров сегодня</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{data.viewsToday}</div>
        </div>

        <div
          style={{
            background: '#f5f5f5',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: '#666' }}>Просмотров за неделю</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{data.viewsThisWeek}</div>
        </div>
      </div>

      {/* Таблица популярных товаров */}
      <h3>🔥 Топ товаров по просмотрам</h3>
      <div
        style={{
          overflowX: 'auto',
          marginTop: '15px',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
          }}
        >
          <thead>
            <tr
              style={{
                background: '#f5f5f5',
                borderBottom: '2px solid #ddd',
              }}
            >
              <th style={{ padding: '12px', textAlign: 'left' }}>Товар</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Цена</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Просмотры</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>% от всех</th>
            </tr>
          </thead>
          <tbody>
            {data.stats.map((stat, idx) => (
              <tr
                key={stat.productId}
                style={{
                  borderBottom: '1px solid #eee',
                  background: idx % 2 === 0 ? 'transparent' : '#fafafa',
                }}
              >
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {stat.product?.images?.[0] && (
                      <img
                        src={stat.product.images[0].url}
                        alt={stat.product.name}
                        style={{
                          width: '40px',
                          height: '40px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                        }}
                      />
                    )}
                    <div>
                      <strong>{stat.product?.name || 'Unknown'}</strong>
                      <br />
                      <small style={{ color: '#999' }}>ID: {stat.productId}</small>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {stat.product?.price ? `₽${stat.product.price.toLocaleString('ru-RU')}` : '—'}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <strong>{stat.views}</strong>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {data.totalViews > 0
                    ? ((stat.views / data.totalViews) * 100).toFixed(1)
                    : 0}
                  %
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.stats.length === 0 && (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: '#999',
            background: '#f5f5f5',
            borderRadius: '8px',
            marginTop: '20px',
          }}
        >
          📊 Пока нет данных о просмотрах. Товары еще не открывали.
          <br/>
          <small style={{marginTop: '10px', display: 'block'}}>Данные обновляются каждые 5 секунд</small>
        </div>
      )}
    </div>
  );
}
