'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {Product,formatPrice} from '@/lib/products';
import {useCart} from '@/components/Cart';

export function ProductView({slug}:{slug:string}){
  const[p,setP]=useState<Product|null>(null);
  const[size,setSize]=useState('');
  const[reviews,setReviews]=useState<any[]>([]);
  const[rating,setRating]=useState(5);
  const[comment,setComment]=useState('');
  const[reviewMsg,setReviewMsg]=useState('');
  const[reviewMsgType,setReviewMsgType]=useState<'ok'|'err'>('ok');
  const[loading,setLoading]=useState(true);
  const[currentImageIndex, setCurrentImageIndex]=useState(0);
  const{add}=useCart();
  
  useEffect(()=>{
    setLoading(true);
    Promise.all([
      fetch('/api/products/'+slug).then(r=>r.ok?r.json():null),
      fetch('/api/products/'+slug+'/reviews').then(r=>r.ok?r.json():null)
    ]).then(([product, reviewData]) => {
      setP(product);
      if(reviewData) setReviews(reviewData.reviews || []);
      const first = product?.variants?.find((v:any)=>v.inStock!==false);
      setSize(first?.size || product?.variants?.[0]?.size || '');
      
      // Логирование просмотра товара
      if(product?.id) {
        fetch('/api/products/view', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({productId: product.id})
        }).catch(e => console.error('View logging failed:', e));
      }
    }).finally(()=>setLoading(false));
  },[slug]);
  
  const variantExists = !!p?.variants?.find(v=>v.size===size);
  const variantInStock = p?.variants?.find(v=>v.size===size)?.inStock !== false;

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!p) return;
    setReviewMsg('');
    try {
      const res = await fetch(`/api/products/${slug}/reviews`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({rating, comment})
      });
      const data = await res.json().catch(() => null);
      if(res.status === 401) {
        setReviewMsgType('err');
        setReviewMsg('Войдите в аккаунт, чтобы оставить отзыв.');
        return;
      }
      if(!res.ok) {
        setReviewMsgType('err');
        setReviewMsg(data?.error || 'Не удалось отправить отзыв');
        return;
      }
      const newReview = data;
      setReviews([newReview, ...reviews]);
      setRating(5);
      setComment('');
      setReviewMsgType('ok');
      setReviewMsg('Спасибо! Ваш отзыв добавлен.');
      setP({...p, rating: (p.rating * p.reviewCount + rating) / (p.reviewCount + 1), reviewCount: p.reviewCount + 1});
    } catch {
      setReviewMsgType('err');
      setReviewMsg('Ошибка при отправке. Попробуйте ещё раз.');
    }
  };

  const nextImage = () => {
    if(p?.images) setCurrentImageIndex((i) => (i + 1) % p.images.length);
  };

  const prevImage = () => {
    if(p?.images) setCurrentImageIndex((i) => (i - 1 + p.images.length) % p.images.length);
  };
  
  if(loading)return <main className="detailInfo">Загрузка...</main>;
  if(!p)return <main className="detailInfo">Товар не найден</main>;

  const currentImage = p.images?.[currentImageIndex];
  const totalImages = p.images?.length || 0;
  
  return <main className="detailPage">
    <div className={'detailPhoto '+p.tone}>
      {currentImage ? (
        <img src={currentImage.url} alt={p.name} style={{width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center'}} />
      ) : (
        <span>НЕЛЛА</span>
      )}
      
      {totalImages > 1 && (
        <>
          <button className="galleryNav prevBtn" onClick={prevImage}>‹</button>
          <button className="galleryNav nextBtn" onClick={nextImage}>›</button>
          <small className="galleryCounter">{currentImageIndex + 1} / {totalImages}</small>
        </>
      )}

      {/* Миниатюры */}
      {totalImages > 1 && (
        <div className="galleryThumbs">
          {p.images.map((img, idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentImageIndex(idx)}
              className={`thumb ${idx === currentImageIndex ? 'active' : ''}`}
              style={{
                width: '40px',
                height: '40px',
                border: idx === currentImageIndex ? '2px solid #000' : '1px solid #ddd',
                padding: 0,
                cursor: 'pointer',
                background: 'none'
              }}
            >
              <img src={img.url} alt={`${p.name} ${idx + 1}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </button>
          ))}
        </div>
      )}
    </div>
    <div className="detailInfo">
      <Link href="/catalog" className="back">← Каталог</Link>
      <h1>{p.name}</h1>
      <div className="detailPrice">
        {p.offerPrice != null && p.offerPrice < p.price ? (
          <>
            <span style={{ color: '#ff6b6b' }}>{formatPrice(p.offerPrice)}</span>{' '}
            <s style={{ color: '#999', fontSize: '14px' }}>{formatPrice(p.price)}</s>
          </>
        ) : (
          formatPrice(p.price)
        )}
      </div>
      
      {p.reviewCount > 0 && (
        <div className="ratingStars">
          {'★'.repeat(Math.round(p.rating))}{'☆'.repeat(5 - Math.round(p.rating))} ({p.rating.toFixed(1)}) {p.reviewCount} отзывов
        </div>
      )}
      
      <p className="detailDescription">{p.description}</p>
      
      <div className="optionBlock">
        <b>Цвет</b>
        <p>{p.color}</p>
      </div>
      
      <div className="optionBlock">
        <b>Размер</b>
        <div className="sizes">
          {(p.variants||[]).map(v=>{
            const avail=v.inStock!==false;
            return (
            <button 
              className={v.size===size?'selectedSize':''} 
              disabled={!avail} 
              onClick={()=>setSize(v.size)} 
              key={v.size}
              style={!avail?{opacity:0.5,cursor:'not-allowed'}:undefined}
            >{v.size}{!avail?' · нет':''}</button>
            );
          })}
        </div>
      </div>
      
      <button 
        className="darkButton fullButton" 
        disabled={!variantInStock || !variantExists} 
        onClick={()=>add(p,size)}
      >
        {!variantExists || !variantInStock?'Нет в наличии':'Добавить в корзину'}
      </button>
      
      <details className="accordions">
        <summary>Описание и характеристики</summary>
        <p>{p.description}</p>
      </details>
      
      <details className="accordions">
        <summary>Отзывы ({p.reviewCount})</summary>
        <div className="reviewsSection">
          <form className="reviewForm" onSubmit={submitReview}>
            <label>Ваша оценка
              <select value={rating} onChange={(e)=>setRating(Number(e.target.value))}>
                <option value={5}>★★★★★ Отлично</option>
                <option value={4}>★★★★☆ Хорошо</option>
                <option value={3}>★★★☆☆ Нормально</option>
                <option value={2}>★★☆☆☆ Плохо</option>
                <option value={1}>★☆☆☆☆ Очень плохо</option>
              </select>
            </label>
            <label>Комментарий (опционально)
              <textarea value={comment} onChange={(e)=>setComment(e.target.value)} placeholder="Поделитесь мнением..."/>
            </label>
            <button className="darkButton" type="submit">Отправить отзыв</button>
            {reviewMsg && <p className={`reviewMsg ${reviewMsgType}`}>{reviewMsg}</p>}
          </form>
          
          <div className="reviewsList">
            {reviews.length === 0 ? (
              <p className="noReviews">Отзывов пока нет — будьте первым!</p>
            ) : reviews.map(r=>(
              <div key={r.id} className="reviewItem">
                <div className="reviewHeader">
                  <span className="reviewRating">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                  <span className="reviewUser">{r.userEmail}</span>
                  <span className="reviewDate">{new Date(r.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
                {r.comment && <p className="reviewComment">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  </main>
}