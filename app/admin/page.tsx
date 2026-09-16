"use client";
import {useEffect,useState,useRef} from "react";
import { generateTrackingNumber } from "@/lib/tracking";


const money=(n:number)=>new Intl.NumberFormat("ru-RU").format(n)+" ₽";
const shortNum=(n:number)=>{if(n>=1000000)return (n/1000000).toFixed(1)+"М";if(n>=1000)return (n/1000).toFixed(1)+"К";return String(n)};
const shortDate=(iso:string)=>{const d=iso?new Date(iso+"T00:00:00"):null;return d?d.toLocaleDateString("ru-RU",{day:"numeric",month:"short"}):""};
const statuses=["NEW","PROCESSING","SHIPPED","DELIVERED","COMPLETED","CANCELLED"];
const payStatuses=["PENDING","PAID","FAILED","REFUNDED","CANCELLED"];
const deliveryLabels:any={COURIER:"Курьер",PICKUP:"Самовывоз",MAIL:"Почта"};
const payLabelsForDelta:any={PENDING:"Ожидание",PAID:"Оплачен",FAILED:"Ошибка",REFUNDED:"Возврат",CANCELLED:"Отменён"};

const statusLabels = {
  NEW: "Новый",
  PROCESSING: "Обработка",
  SHIPPED: "Отправлен",
  DELIVERED: "Доставлен",
  COMPLETED: "Завершён",
  CANCELLED: "Отменён"
};

const payStatusLabels = {
  PENDING: "Ожидание",
  PAID: "Оплачен",
  FAILED: "Ошибка",
  REFUNDED: "Возврат",
  CANCELLED: "Отменён"
};

export default function Admin(){
 const [tab,setTab]=useState("dashboard"),[products,setProducts]=useState<any[]>([]),[orders,setOrders]=useState<any[]>([]),[cats,setCats]=useState<any[]>([]),[collections,setCollections]=useState<any[]>([]),[discounts,setDiscounts]=useState<any[]>([]),[stats,setStats]=useState<any>(null),[edit,setEdit]=useState<any>(null),[msg,setMsg]=useState("");
 const [logs,setLogs]=useState<any[]>([]);
 const [adminLogs,setAdminLogs]=useState<any[]>([]);
 const [selectedOrder, setSelectedOrder] = useState<any>(null);
 const [filterStatus, setFilterStatus] = useState("");
 const [filterPayStatus, setFilterPayStatus] = useState("");
 const [filterSearch, setFilterSearch] = useState("");
 const [dateRange, setDateRange] = useState({from: "", to: ""});
 const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [selectedCollections, setSelectedCollections] = useState<Set<number>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const pickerBtnRef = useRef<any>(null);
  const [pickerPos, setPickerPos] = useState<{top:number;left:number;width:number}|null>(null);
  const [hero, setHero] = useState<any>(null);
 
 const load=async()=>{
  const [p,o,c,cl,d,st,se,lg,alg]=await Promise.all([fetch("/api/admin/products"),fetch("/api/admin/orders"),fetch("/api/categories"),fetch("/api/admin/collections"),fetch("/api/admin/discounts"),fetch("/api/admin/stats"),fetch("/api/admin/settings"),fetch("/api/admin/customer-logs"),fetch("/api/admin/logs")]);
  if(p.status===401){location.href="/admin/login";return}
  setProducts(await p.json());
  setOrders(await o.json());
  setCats(await c.json());
  setCollections(await cl.json());
  setDiscounts(await d.json());
  if(se.ok) setHero(await se.json());
  if(st.ok) setStats(await st.json());
  if(lg.ok) setLogs(await lg.json());
  if(alg.ok) setAdminLogs(await alg.json());
 };
 
 useEffect(()=>{load()},[]);
 
  useEffect(()=>{
   if(!edit) return;
   setPickerOpen(false);
   setPickerQuery("");
   if(tab==="collections"){
     setSelectedProducts(new Set(edit.products?.map((cp:any)=>cp.productId)||[]));
   } else if(tab==="products"){
     setSelectedCollections(new Set(edit.collections?.map((cc:any)=>cc.collectionId)||[]));
   }
  },[edit,tab]);

  useEffect(()=>{
   if(!pickerOpen) return;
   const place=()=>{
     const r=pickerBtnRef.current?.getBoundingClientRect();
     if(!r) return;
     const dh=430;
     const below=(r.bottom+dh<window.innerHeight)||r.top<dh;
     setPickerPos({top: below?r.bottom+6:Math.max(8,r.top-dh), left:r.left, width:r.width});
   };
   place();
   window.addEventListener("scroll",place,true);
   window.addEventListener("resize",place);
   return ()=>{window.removeEventListener("scroll",place,true);window.removeEventListener("resize",place);};
  },[pickerOpen]);

 const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if(!e.currentTarget.files) return;
  const formData = new FormData();
  Array.from(e.currentTarget.files).forEach(file => {
    formData.append('files', file);
  });
  const r = await fetch('/api/admin/upload', {method: 'POST', body: formData});
  if(r.ok) {
    const data = await r.json();
    setUploadedImages([...uploadedImages, ...data.urls]);
    setMsg(`Загружено ${data.urls.length} фото`);
  } else {
    setMsg('Ошибка загрузки');
  }
 };

 const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if(!e.currentTarget.files) return;
  const formData = new FormData();
  Array.from(e.currentTarget.files).forEach(file => {
    formData.append('files', file);
  });
  const r = await fetch('/api/admin/upload', {method: 'POST', body: formData});
  if(r.ok) {
    const data = await r.json();
    setHero((h:any)=>({...h, photoImage: data.urls[0]||""}));
    setMsg(`Загружено ${data.urls.length} фото`);
  } else {
    setMsg('Ошибка загрузки');
  }
 };

 async function saveHero(e:any){
  e.preventDefault();
  if(!hero) return;
  const r = await fetch('/api/admin/settings', {method: 'PUT', headers: {"Content-Type": "application/json"}, body: JSON.stringify(hero)});
  const d = await r.json();
  if(!r.ok){setMsg(d.error||"Ошибка");return}
  setMsg("Главная сохранена");
  load();
 }

 async function save(e:any){
  e.preventDefault();
  const b=Object.fromEntries(new FormData(e.currentTarget).entries());
  
  if(tab === "collections") {
    const productIds = Array.from(selectedProducts);
    const url=edit?.id?`/api/admin/collections/${edit.id}`:"/api/admin/collections";
    const payload={name:b.name,slug:b.slug,description:b.description,image:b.image||"",sortOrder:Number(b.sortOrder||0),active:b.active==="on",productIds};
    
    const r=await fetch(url,{method:edit?.id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const d=await r.json();
    if(!r.ok){setMsg(d.error||"Ошибка");return}
    setEdit(null);
    setSelectedProducts(new Set());
    setMsg("Коллекция сохранена");
    load();
    return;
  }
  
  if(tab === "discounts") {
    const url=edit?.id?`/api/admin/discounts/${edit.id}`:"/api/admin/discounts";
    const payload={code:b.code,description:b.description,type:b.type||"PERCENT",value:Number(b.value),maxUses:b.maxUses?Number(b.maxUses):null,active:b.active==="on",productId:b.productId?Number(b.productId):null,collectionId:b.collectionId?Number(b.collectionId):null,startsAt:b.startsAt||null,expiresAt:b.expiresAt||null};
    
    const r=await fetch(url,{method:edit?.id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const d=await r.json();
    if(!r.ok){setMsg(d.error||"Ошибка");return}
    setEdit(null);
    setMsg("Скидка сохранена");
    load();
    return;
  }
  
  if(tab === "categories") {
    const url=edit?.id?`/api/admin/categories/${edit.id}`:"/api/admin/categories";
    const payload={name:b.name,slug:b.slug};
    const r=await fetch(url,{method:edit?.id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const d=await r.json();
    if(!r.ok){setMsg(d.error||"Ошибка");return}
    setEdit(null);
    setMsg("Категория сохранена");
    load();
    return;
  }
  
  const variants=(edit?.variants||[]).map((v:any)=>({...v,stock:Number((e.currentTarget.elements[`stock_${v.id}`] as HTMLInputElement)?.value||v.stock)}));
  const imageUrls = [...(uploadedImages || []), ...(b.images||"").split("\n").map((x:string)=>x.trim()).filter(Boolean)];
  const url=edit?.id?`/api/admin/products/${edit.id}`:"/api/admin/products";
   const payload={...b,price:Number(b.price),categoryId:Number(b.categoryId),variants,images:imageUrls,collectionIds:Array.from(selectedCollections)};
  
  const r=await fetch(url,{method:edit?.id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const d=await r.json();
  if(!r.ok){setMsg(d.error||"Ошибка");return}
  setEdit(null);
  setUploadedImages([]);
  setMsg("Товар сохранён");
  load();
 }
 
 async function del(id:number, type:string){if(!confirm("Удалить?"))return;await fetch(`/api/admin/${type}/${id}`,{method:"DELETE"});load()}
 
 async function updateOrderStatus(id:number, status:string, payStatus?: string, trackingNumber?: string) {
  const payload: any = { status };
  if(payStatus) payload.paymentStatus = payStatus;
  if(trackingNumber !== undefined) payload.trackingNumber = trackingNumber;
  const r = await fetch(`/api/admin/orders/${id}`, {method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)});
  if(r.ok) {
    setMsg("Статус обновлён");
    load();
    if(selectedOrder) setSelectedOrder({...selectedOrder, status, paymentStatus: payStatus || selectedOrder.paymentStatus, trackingNumber: trackingNumber !== undefined ? trackingNumber : selectedOrder.trackingNumber});
  }
 }

 async function saveTracking(id:number, trackingNumber:string) {
  await updateOrderStatus(id, selectedOrder?.status || "PROCESSING", undefined, trackingNumber);
 }
 
 async function logout(){await fetch("/api/auth/logout",{method:"POST"});location.href="/admin/login"}
 
 const filteredOrders = orders.filter(o => {
  if(filterStatus && o.status !== filterStatus) return false;
  if(filterPayStatus && o.paymentStatus !== filterPayStatus) return false;
  if(filterSearch && !o.email.includes(filterSearch) && !o.customerName.toLowerCase().includes(filterSearch.toLowerCase())) return false;
  if(dateRange.from && new Date(o.createdAt) < new Date(dateRange.from)) return false;
  if(dateRange.to && new Date(o.createdAt) > new Date(dateRange.to)) return false;
  return true;
 });
 
 return <main className="adminPage">
  <div className="adminHead">
    <div>
      <span className="eyebrow">CONTROL PANEL</span>
      <h1>Nella Premium</h1>
      <p>Товары, коллекции, скидки, заказы</p>
    </div>
    <div className="adminHeadActions">
      <a href="/" className="darkButton">Открыть магазин</a>
      <button className="lightButton" onClick={logout}>Выйти</button>
    </div>
  </div>

  <div className="adminStats">
    <div><b>{stats?.orders?.total ?? orders.length}</b><span>всего заказов</span></div>
    <div><b>{stats?.orders?.new7 ?? 0}</b><span>заказов (7 дней)</span></div>
    <div><b>{stats?.users?.total ?? "—"}</b><span>клиентов</span></div>
    <div><b>{stats?.users?.new7 ?? 0}</b><span>новых за 7 дней</span></div>
    <div><b>{shortNum(stats?.catalog?.stock ?? 0)}</b><span>единиц на складе</span></div>
    <div><b>{money(stats?.revenue?.total ?? orders.reduce((s,o)=>s+o.total,0))}</b><span>выручка</span></div>
    <div><b>{money(stats?.revenue?.avgOrder ?? 0)}</b><span>средний чек</span></div>
    <div><b>{stats?.catalog?.products ?? products.length}</b><span>товаров</span></div>
    <div><b>{stats?.catalog?.categories ?? cats.length}</b><span>категорий</span></div>
    <div><b>{stats?.catalog?.reviews ?? 0}</b><span>отзывов</span></div>
  </div>

  <div className="adminTabs">
    <button className={tab==="dashboard"?"active":""} onClick={()=>setTab("dashboard")}>Аналитика</button>
    <button className={tab==="home"?"active":""} onClick={()=>setTab("home")}>Главная</button>
    <button className={tab==="products"?"active":""} onClick={()=>setTab("products")}>Товары ({products.length})</button>
    <button className={tab==="collections"?"active":""} onClick={()=>setTab("collections")}>Коллекции ({collections.length})</button>
    <button className={tab==="categories"?"active":""} onClick={()=>setTab("categories")}>Категории ({cats.length})</button>
    <button className={tab==="discounts"?"active":""} onClick={()=>setTab("discounts")}>Скидки ({discounts.length})</button>
    <button className={tab==="orders"?"active":""} onClick={()=>setTab("orders")}>Заказы ({orders.length})</button>
    <button className={tab==="logs"?"active":""} onClick={()=>setTab("logs")}>Действия покупателей</button>
    <button className={tab==="adminlogs"?"active":""} onClick={()=>setTab("adminlogs")}>Действия админов</button>
  </div>

  {tab==="home"?<div className="adminGrid">
    <section className="adminTable">
      <div className="adminTableTop"><h2>Главная — баннер</h2><span className="statsMuted">Название, слоган, описание и фото</span></div>
      <div className="heroPreview" style={{margin:'16px 0',border:'1px solid var(--line)',borderRadius:'8px',overflow:'hidden'}}>
        <div style={{padding:'28px',background:'var(--paper)'}}>
          <span style={{font:'10px "DM Sans",sans-serif',letterSpacing:'2px',color:'var(--muted)',display:'block',marginBottom:'10px'}}>{hero?.eyebrow||"…"}</span>
          <div style={{font:'24px "Playfair Display",serif',lineHeight:'1.05'}}>{hero?.title1||"…"}<br/><em>{hero?.title2||"…"}</em><br/>{(hero?.title3||"…")}</div>
          <p style={{font:'13px "DM Sans",sans-serif',color:'var(--muted)',margin:'10px 0 16px'}}>{hero?.subtitle||"…"}</p>
          <span className="darkButton">{hero?.button||"…"}</span>
        </div>
        {hero?.photoImage?<div style={{aspectRatio:'16/9',backgroundImage:`url(${hero.photoImage})`,backgroundSize:'cover',backgroundPosition:'center'}}/>:null}
      </div>
    </section>
    <form className="adminForm" onSubmit={saveHero}><h2>Настройки баннера</h2>{hero&&<>
      <label>Надзаголовок<input value={hero.eyebrow} onChange={(e)=>setHero({...hero,eyebrow:e.target.value})}/></label>
      <label>Заголовок — строка 1<input value={hero.title1} onChange={(e)=>setHero({...hero,title1:e.target.value})}/></label>
      <label>Заголовок — строка 2 (курсив)<input value={hero.title2} onChange={(e)=>setHero({...hero,title2:e.target.value})}/></label>
      <label>Заголовок — строка 3<input value={hero.title3} onChange={(e)=>setHero({...hero,title3:e.target.value})}/></label>
      <label>Описание<textarea value={hero.subtitle} onChange={(e)=>setHero({...hero,subtitle:e.target.value})}/></label>
      <label>Текст кнопки<input value={hero.button} onChange={(e)=>setHero({...hero,button:e.target.value})}/></label>
      <label>Подпись на фото<input value={hero.photoLabel} onChange={(e)=>setHero({...hero,photoLabel:e.target.value})}/></label>
      <label>Мелкая подпись<input value={hero.photoCaption} onChange={(e)=>setHero({...hero,photoCaption:e.target.value})}/></label>
      <label>Фото баннера (URL)<input value={hero.photoImage} onChange={(e)=>setHero({...hero,photoImage:e.target.value})} placeholder="https://...jpg"/></label>
      <div><input type="file" accept="image/*" onChange={handleHeroImageUpload}/></div>
      <div className="formButtons"><button className="darkButton">Сохранить</button></div>
      {msg&&<small style={{display:'block',marginTop:'10px'}}>{msg}</small>}
    </>}</form>
  </div>:tab==="dashboard"?<div className="statsDashboard">
    {stats?<>
      <div className="statsCats">
        <div className="statsKpi" data-tone="ink"><span>Выручка (оплачено)</span><b>{money(stats.revenue?.paid||0)}</b></div>
        <div className="statsKpi" data-tone="gold"><span>Выручка за месяц</span><b>{money(stats.revenue?.month||0)}</b></div>
        <div className="statsKpi" data-tone="ink"><span>Выручка за год</span><b>{money(stats.revenue?.year||0)}</b></div>
        <div className="statsKpi" data-tone="gold"><span>Средний чек</span><b>{money(stats.revenue?.avgOrder||0)}</b></div>
        <div className="statsKpi" data-tone="ink"><span>Клиентов</span><b>{stats.users?.total||0}</b><em>+{stats.users?.new30||0} за 30 дней</em></div>
        <div className="statsKpi" data-tone="gold"><span>Просмотров товаров</span><b>{shortNum(stats.catalog?.views||0)}</b></div>
        <div className="statsKpi" data-tone="ink"><span>Оплаченных заказов</span><b>{stats.orders?.paid||0}</b><em>из {stats.orders?.total||0}</em></div>
        <div className="statsKpi" data-tone="gold"><span>Использовано скидок</span><b>{stats.discounts?.usedCount||0}</b></div>
      </div>

      <div className="statsRow">
        <section className="statsCard">
          <h3>Заказы за 14 дней</h3>
          <div className="trendBars">
            {(stats.trend||[]).map((t:any)=>(
              <div className="trendCol" key={t.date} title={`${shortDate(t.date)}: ${t.orders} зак., ${money(t.revenue)}`}>
                <div className="trendBar" style={{height: `${Math.max(3,(t.orders/(Math.max(1,Math.max(...(stats.trend||[]).map((x:any)=>x.orders)))*1.2))*100)}%`}}/>
                <span>{shortDate(t.date)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="statsCard">
          <h3>Статусы заказов</h3>
          <div className="deltaLegend">
            {statuses.map(s=><div className="deltaRow" key={s}><span>{statusLabels[s as keyof typeof statusLabels]}</span><div className="deltaTrack"><div className="deltaFill" style={{width: `${(stats.byStatus?.[s]||0)/Math.max(1,stats.orders?.total||1)*100}%`}}/></div><b>{stats.byStatus?.[s]||0}</b></div>)}
          </div>
        </section>
      </div>

      <div className="statsRow">
        <section className="statsCard">
          <h3>Способ оплаты</h3>
          <div className="deltaLegend">
            {payStatuses.map(s=><div className="deltaRow" key={s}><span>{payLabelsForDelta[s]||s}</span><div className="deltaTrack"><div className="deltaFill" style={{width: `${(stats.byPayment?.[s]||0)/Math.max(1,stats.orders?.total||1)*100}%`}}/></div><b>{stats.byPayment?.[s]||0}</b></div>)}
          </div>
        </section>

        <section className="statsCard">
          <h3>Способ доставки</h3>
          <div className="deltaLegend">
            {["COURIER","PICKUP","MAIL"].map(s=><div className="deltaRow" key={s}><span>{deliveryLabels[s]||s}</span><div className="deltaTrack"><div className="deltaFill" style={{width: `${(stats.byDelivery?.[s]||0)/Math.max(1,stats.orders?.total||1)*100}%`}}/></div><b>{stats.byDelivery?.[s]||0}</b></div>)}
          </div>
        </section>
      </div>

      <div className="statsRow">
        <section className="statsCard">
          <h3>Топ продаж</h3>
          {(stats.topProducts||[]).length===0?<p className="statsMuted">Пока нет продаж</p>:<div className="topList">
            {(stats.topProducts||[]).map((t:any,i:number)=><div className="topRow" key={i}><span className="topRank">{i+1}</span>{t.image?<div className="topThumb"><img src={t.image} alt=""/></div>:<div className="topThumb topThumbPh">N</div>}<b>{t.name}</b><em>{t.quantity} × {money(t.price)}</em></div>)}
          </div>}
        </section>
      </div>
    </>:<p className="statsMuted">Загрузка аналитики…</p>}
  </div>:tab==="products"?<div className="adminGrid">
    <section className="adminTable">
      <div className="adminTableTop"><h2>Каталог</h2><button className="darkButton" onClick={()=>{setEdit({id:0,name:"",slug:"",price:0,color:"",tone:"linen",categoryId:cats[0]?.id||1,source:"",sourceUrl:"",description:"",images:[],variants:[]});setUploadedImages([]);setSelectedCollections(new Set());}}>+ Новый товар</button></div>
      {products.map(p=><div className="adminProduct" key={p.id}><div className={`adminThumb ${p.tone}`}>{p.images?.[0]?.url?<img src={p.images[0].url} alt=""/>:"N"}</div><div><b>{p.name}</b><small>{p.category.name} · {p.color} · {p.variants.reduce((a:any,v:any)=>a+v.stock,0)} шт. · {p.images.length} фото</small>{p.source&&<em>{p.source}</em>}</div><strong>{money(p.price)}</strong><div className="adminActions"><button onClick={()=>{setEdit(p);setUploadedImages([]);}}>Изменить</button><button onClick={()=>del(p.id,"products")}>Удалить</button></div></div>)}
    </section>
    <form className="adminForm" onSubmit={save}><h2>{edit?edit.id?"Редактирование":"Новый товар":"Выберите товар"}</h2>{edit&&<><label>Название<input name="name" defaultValue={edit.name} required/></label><label>Slug<input name="slug" defaultValue={edit.slug} required/></label><label>Цена<input name="price" type="number" defaultValue={edit.price} required/></label><label>Цвет<input name="color" defaultValue={edit.color} required/></label><label>Тон карточки<select name="tone" defaultValue={edit.tone} required>{[["linen","Лён"],["sand","Песок"],["camel","Верблюжий"],["white","Белый"],["mocha","Мокко"],["brown","Коричневый"],["graphite","Графит"],["black","Чёрный"]].map(([v,l]:any)=><option key={v} value={v}>{l}</option>)}</select></label><label>Категория<select name="categoryId" defaultValue={edit.categoryId}>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Источник<input name="source" defaultValue={edit.source||""}/></label><label>Ссылка на источник<input name="sourceUrl" defaultValue={edit.sourceUrl||""}/></label><div style={{position:'relative',marginBottom:'15px'}}>
  <label style={{display:'block',marginBottom:'8px',fontSize:'11px',color:'var(--muted)'}}>Коллекции ({selectedCollections.size} выбрано)</label>
  <button ref={pickerBtnRef} type="button" onClick={()=>{const r=pickerBtnRef.current?.getBoundingClientRect();if(r){const dh=430;const below=(r.bottom+dh<window.innerHeight)||r.top<dh;setPickerPos({top:below?r.bottom+6:Math.max(8,r.top-dh),left:r.left,width:r.width});}setPickerOpen(o=>!o);}} style={{display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',border:'1px solid var(--line)',background:'#fff',padding:'12px',borderRadius:'4px',cursor:'pointer',font:'13px "DM Sans",sans-serif',color:'#1c1b19'}}>
    <span>{selectedCollections.size?`${selectedCollections.size} коллекций выбрано`:"Выбрать коллекции"}</span>
    <span style={{color:'var(--muted)',fontSize:'12px'}}>{pickerOpen?"▲":"▾"}</span>
  </button>
  {pickerOpen&&<><div onClick={()=>setPickerOpen(false)} style={{position:'fixed',inset:0,zIndex:40}}/>
  <div style={{position:'fixed',top:pickerPos?pickerPos.top:0,left:pickerPos?pickerPos.left:0,width:pickerPos?pickerPos.width:'100%',zIndex:50,border:'1px solid var(--line)',borderRadius:'6px',background:'#fff',boxShadow:'0 20px 50px rgba(0,0,0,.18)',padding:'12px'}}>
    <input value={pickerQuery} onChange={(e)=>setPickerQuery(e.target.value)} placeholder="Поиск коллекций..." style={{display:'block',width:'100%',marginBottom:'10px',border:'1px solid var(--line)',padding:'10px',borderRadius:'4px',font:'13px "DM Sans",sans-serif'}}/>
    <div style={{maxHeight:'360px',overflowY:'auto'}}>
      {collections.filter((c:any)=>(c.name||"").toLowerCase().includes(pickerQuery.toLowerCase())).length===0
        ?<p style={{margin:0,color:'var(--muted)',fontSize:'12px'}}>Нет коллекций</p>
        :collections.filter((c:any)=>(c.name||"").toLowerCase().includes(pickerQuery.toLowerCase())).map((c:any)=><div key={c.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px',marginBottom:'6px',background:selectedCollections.has(c.id)?'#efe9e1':'#fff',borderRadius:'3px',border:selectedCollections.has(c.id)?'1px solid var(--ink)':'1px solid transparent',cursor:'pointer'}} onClick={()=>{const ns=new Set(selectedCollections);if(ns.has(c.id))ns.delete(c.id);else ns.add(c.id);setSelectedCollections(ns);}}>
            <div style={{width:'42px',height:'42px',flex:'0 0 auto',borderRadius:'3px',overflow:'hidden',background:'#d5c7b5',display:'grid',placeItems:'center',color:'#fff',fontSize:'10px',fontFamily:'Playfair Display, serif'}}>{c.image?<img src={c.image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:"нет"}</div>
            <input type="checkbox" checked={selectedCollections.has(c.id)} onChange={()=>{}} style={{marginRight:'2px',width:'16px',height:'16px',cursor:'pointer'}}/>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:'13px',color:'#1c1b19',fontWeight:'500'}}>{c.name}</div></div>
          </div>)}
    </div>
    <button type="button" onClick={()=>setPickerOpen(false)} style={{marginTop:'10px',width:'100%',border:'1px solid var(--ink)',background:'var(--ink)',color:'#fff',padding:'10px',borderRadius:'4px',cursor:'pointer',font:'13px "DM Sans",sans-serif'}}>Готово</button>
  </div></>}
</div><div style={{marginTop: '15px'}}><label style={{display: 'block', marginBottom: '8px', fontSize: '11px', color: 'var(--muted)'}}>Загрузить фото</label><input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{display: 'block', width: '100%', marginBottom: '12px', padding: '8px', border: '1px solid var(--line)'}}/>{(uploadedImages.length > 0 || edit.images?.length > 0) && (<div style={{marginBottom: '15px'}}><label style={{display: 'block', marginBottom: '8px', fontSize: '11px', color: 'var(--muted)'}}>Текущие фото ({(uploadedImages.length + (edit.images?.length || 0))})</label><div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px'}}>{uploadedImages.map((url, idx) => (<div key={idx} style={{position: 'relative', paddingBottom: '100%'}}><img src={url} alt="uploaded" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '3px', border: '2px solid #4CAF50'}}/><button type="button" onClick={() => setUploadedImages(uploadedImages.filter((_, i) => i !== idx))} style={{position: 'absolute', top: '2px', right: '2px', background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '10px'}}>✕</button></div>))}{edit.images?.map((img: any, idx: number) => (<div key={`existing-${idx}`} style={{position: 'relative', paddingBottom: '100%'}}><img src={img.url} alt="existing" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '3px'}}/></div>))}</div></div>)}</div><label>Дополнительные ссылки на фото (по одной в строке)<textarea name="images" defaultValue={(edit.images||[]).filter((i:any) => !uploadedImages.includes(i.url)).map((i:any)=>i.url).join("\n")} placeholder="https://...jpg"/></label><label>Описание<textarea name="description" defaultValue={edit.description||""}/></label><div className="variantsSection"><b className="formLabel">Остатки по размерам</b><div className="variantsList">{edit.variants?.map((v:any)=><label key={v.id} className="variantLabel"><span>{v.size}</span><input name={`stock_${v.id}`} type="number" min="0" defaultValue={v.stock}/></label>)}</div></div><div className="formButtons"><button className="darkButton">Сохранить</button><button type="button" onClick={()=>{setEdit(null);setUploadedImages([]);}}>Отмена</button></div>{msg&&<small>{msg}</small>}</>}</form>
  </div>

  :tab==="collections"?<div className="adminGrid">
    <section className="adminTable">
      <div className="adminTableTop"><h2>Коллекции</h2><button className="darkButton" onClick={()=>{setEdit({id:0,name:"",slug:"",description:"",image:"",sortOrder:0,products:[]});setSelectedProducts(new Set());}}>+ Новая коллекция</button></div>
      {collections.map(c=><div className="adminProduct" key={c.id}><div className="adminThumb" style={{background:'#d5c7b5'}}>{c.image?<img src={c.image} alt=""/>:"C"}</div><div><b>{c.name}</b><small>{c.products.length} товаров · {c.active?"Активна":"Не активна"}</small>{c.description&&<em>{c.description}</em>}</div><strong>{c.products.length}</strong><div className="adminActions"><button onClick={()=>{setEdit(c);const selected=new Set(c.products?.map((cp:any)=>cp.productId)||[]);setSelectedProducts(selected);}}>Редактировать</button><button onClick={()=>del(c.id,"collections")}>Удалить</button></div></div>)}
    </section>
    <form className="adminForm" onSubmit={save}><h2>{edit?edit.id?"Редактирование коллекции":"Новая коллекция":"Выберите коллекцию"}</h2>{edit&&<><label>Название<input name="name" defaultValue={edit.name} required/></label><label>Slug<input name="slug" defaultValue={edit.slug} required/></label><label>Описание<textarea name="description" defaultValue={edit.description||""}/></label><label>Изображение<input name="image" defaultValue={edit.image||""} placeholder="https://...jpg"/></label>        <label>Порядок сортировки<input name="sortOrder" type="number" defaultValue={edit.sortOrder||0}/></label><label style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'6px'}}><input type="checkbox" name="active" defaultChecked={edit.active!==false}/>Активна (показывать на сайте)</label><div style={{position:'relative',marginBottom:'15px'}}>
  <label style={{display:'block',marginBottom:'8px',fontSize:'11px',color:'var(--muted)'}}>Товары в коллекции ({selectedProducts.size} выбрано)</label>
  <button ref={pickerBtnRef} type="button" onClick={()=>{const r=pickerBtnRef.current?.getBoundingClientRect();if(r){const dh=430;const below=(r.bottom+dh<window.innerHeight)||r.top<dh;setPickerPos({top:below?r.bottom+6:Math.max(8,r.top-dh),left:r.left,width:r.width});}setPickerOpen(o=>!o);}} style={{display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',border:'1px solid var(--line)',background:'#fff',padding:'12px',borderRadius:'4px',cursor:'pointer',font:'13px "DM Sans",sans-serif',color:'#1c1b19'}}>
    <span>{selectedProducts.size?`${selectedProducts.size} товар(ов) выбрано`:"Выбрать товары"}</span>
    <span style={{color:'var(--muted)',fontSize:'12px'}}>{pickerOpen?"▲":"▾"}</span>
  </button>
  {pickerOpen&&<><div onClick={()=>setPickerOpen(false)} style={{position:'fixed',inset:0,zIndex:40}}/>
  <div style={{position:'fixed',top:pickerPos?pickerPos.top:0,left:pickerPos?pickerPos.left:0,width:pickerPos?pickerPos.width:'100%',zIndex:50,border:'1px solid var(--line)',borderRadius:'6px',background:'#fff',boxShadow:'0 20px 50px rgba(0,0,0,.18)',padding:'12px'}}>
    <input value={pickerQuery} onChange={(e)=>setPickerQuery(e.target.value)} placeholder="Поиск товаров..." style={{display:'block',width:'100%',marginBottom:'10px',border:'1px solid var(--line)',padding:'10px',borderRadius:'4px',font:'13px "DM Sans",sans-serif'}}/>
    <div style={{maxHeight:'360px',overflowY:'auto'}}>
      {products.filter((p:any)=>(p.name+" "+(p.color||"")).toLowerCase().includes(pickerQuery.toLowerCase())).length===0
        ?<p style={{margin:0,color:'var(--muted)',fontSize:'12px'}}>Нет товаров</p>
        :products.filter((p:any)=>(p.name+" "+(p.color||"")).toLowerCase().includes(pickerQuery.toLowerCase())).map((p:any)=><div key={p.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px',marginBottom:'6px',background:selectedProducts.has(p.id)?'#efe9e1':'#fff',borderRadius:'3px',border:selectedProducts.has(p.id)?'1px solid var(--ink)':'1px solid transparent',cursor:'pointer'}} onClick={()=>{const ns=new Set(selectedProducts);if(ns.has(p.id))ns.delete(p.id);else ns.add(p.id);setSelectedProducts(ns);}}>
            <div style={{width:'42px',height:'42px',flex:'0 0 auto',borderRadius:'3px',overflow:'hidden',background:'#e8e1d8',display:'grid',placeItems:'center',color:'#fff',fontSize:'10px',fontFamily:'Playfair Display, serif'}}>{p.images?.[0]?.url?<img src={p.images[0].url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:"нет"}</div>
            <input type="checkbox" checked={selectedProducts.has(p.id)} onChange={()=>{}} style={{marginRight:'2px',width:'16px',height:'16px',cursor:'pointer'}}/>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:'13px',color:'#1c1b19',fontWeight:'500'}}>{p.name}</div><small style={{color:'var(--muted)',fontSize:'11px'}}>{p.color} · {money(p.price)}</small></div>
          </div>)}
    </div>
    <button type="button" onClick={()=>setPickerOpen(false)} style={{marginTop:'10px',width:'100%',border:'1px solid var(--ink)',background:'var(--ink)',color:'#fff',padding:'10px',borderRadius:'4px',cursor:'pointer',font:'13px "DM Sans",sans-serif'}}>Готово</button>
  </div></>}
</div><div className="formButtons"><button className="darkButton">Сохранить</button><button type="button" onClick={()=>{setEdit(null);setSelectedProducts(new Set());}}>Отмена</button></div>{msg&&<small style={{display:'block',marginTop:'10px'}}>{msg}</small>}</>}</form>
  </div>

  :tab==="categories"?<div className="adminGrid">
    <section className="adminTable">
      <div className="adminTableTop"><h2>Категории</h2><button className="darkButton" onClick={()=>setEdit({id:0,name:"",slug:""})}>+ Новая категория</button></div>
      {cats.length===0?<p className="statsMuted">Категорий пока нет</p>:cats.map(c=><div className="adminProduct" key={c.id}><div className="adminThumb" style={{background:'#d5c7b5'}}>{"K"}</div><div><b>{c.name}</b><small>{c._count?.products??0} товаров</small><em>{c.slug}</em></div><strong>{c._count?.products??0}</strong><div className="adminActions"><button onClick={()=>setEdit({id:c.id,name:c.name,slug:c.slug})}>Редактировать</button><button onClick={()=>del(c.id,"categories")}>Удалить</button></div></div>)}
    </section>
    <form className="adminForm" onSubmit={save}><h2>{edit?.id?"Редактирование категории":"Новая категория"}</h2>{edit&&<><label>Название<input name="name" defaultValue={edit.name} required/></label><label>Slug<input name="slug" defaultValue={edit.slug} required placeholder="например, bruki"/></label><div className="formButtons"><button className="darkButton">Сохранить</button><button type="button" onClick={()=>setEdit(null)}>Отмена</button></div>{msg&&<small style={{display:'block',marginTop:'10px'}}>{msg}</small>}</>}</form>
  </div>

  :tab==="discounts"?<div className="adminGrid">
    <section className="adminTable">
      <div className="adminTableTop"><h2>Скидки</h2><button className="darkButton" onClick={()=>setEdit({id:0,code:"",description:"",type:"PERCENT",value:0,maxUses:null,active:true,productId:null,collectionId:null,startsAt:"",expiresAt:""})}>+ Новая скидка</button></div>
      {discounts.map(d=><div className="adminProduct" key={d.id}><div style={{padding:'10px',background:d.active?'#d5cec0':'#f0f0f0',borderRadius:'4px',color:'#1c1b19',fontWeight:'bold',textAlign:'center'}}>{d.value}{d.type==="PERCENT"?"%":"₽"}</div><div><b>{d.code}</b><small>{d.product?`На товар: ${d.product.name}`:d.collection?`На коллекцию: ${d.collection.name}`:"Универсальная"} · {d.active?"Активна":"Не активна"}</small>{d.description&&<em>{d.description}</em>}</div><strong>{d.usedCount}/{d.maxUses||"∞"}</strong><div className="adminActions"><button onClick={()=>setEdit(d)}>Редактировать</button><button onClick={()=>del(d.id,"discounts")}>Удалить</button></div></div>)}
    </section>
    <form className="adminForm" onSubmit={save}><h2>{edit?edit.id?"Редактирование скидки":"Новая скидка":"Выберите скидку"}</h2>{edit&&<><label>Код<input name="code" defaultValue={edit.code} required placeholder="SUMMER20"/></label><label>Описание<textarea name="description" defaultValue={edit.description||""} placeholder="Скидка 20% на летнюю коллекцию"/></label><label>Тип<select name="type" defaultValue={edit.type}><option value="PERCENT">Процент %</option><option value="FIXED">Фиксированная сумма ₽</option></select></label><label>Значение<input name="value" type="number" defaultValue={edit.value} required/></label><label>Макс использований<input name="maxUses" type="number" placeholder="Без ограничений" defaultValue={edit.maxUses||""}/></label><label>На товар<select name="productId"><option value="">Не выбран</option>{products.map(p=><option key={p.id} value={p.id} selected={edit.productId===p.id}>{p.name}</option>)}</select></label><label>На коллекцию<select name="collectionId"><option value="">Не выбрана</option>{collections.map(c=><option key={c.id} value={c.id} selected={edit.collectionId===c.id}>{c.name}</option>)}</select></label><label>Начало действия<input name="startsAt" type="datetime-local" defaultValue={edit.startsAt||""}/></label><label>Конец действия<input name="expiresAt" type="datetime-local" defaultValue={edit.expiresAt||""}/></label><label><input type="checkbox" name="active" defaultChecked={edit.active}/>Активна</label><div className="formButtons"><button className="darkButton">Сохранить</button><button type="button" onClick={()=>setEdit(null)}>Отмена</button></div>{msg&&<small>{msg}</small>}</>}</form>
  </div>

  :tab==="logs"?<div className="adminGrid">
    <section className="adminTable">
      <div className="adminTableTop"><h2>Журнал действий покупателей</h2><span className="statsMuted">Регистрации, входы, избранное, корзина, заказы, адреса</span></div>
      {logs.length===0?<p className="statsMuted">Действий пока нет</p>:<table className="orderItems">
        <thead><tr><th>Дата</th><th>Покупатель</th><th>Действие</th><th>Объект</th><th>ID</th><th>Детали</th></tr></thead>
        <tbody>
          {logs.map((l:any)=>(
            <tr key={l.id}>
              <td style={{whiteSpace:'nowrap'}}>{new Date(l.createdAt).toLocaleString("ru-RU")}</td>
              <td>{l.email || (l.userId ? `#${l.userId}` : l.guestId ? `Гость ${String(l.guestId).slice(0,8)}` : "—")}</td>
              <td><span className={`statusBadge status-${l.action==="DELETE"||l.action==="WISHLIST_REMOVE"?"cancelled":l.action==="REGISTER"||l.action==="ORDER_CREATE"||l.action==="ADDRESS_CREATE"||l.action==="WISHLIST_ADD"?"new":l.action==="LOGIN"?"shipped":"processing"}`}>{l.action}</span></td>
              <td>{l.entity}</td>
              <td>{l.entityId||"—"}</td>
              <td style={{maxWidth:340,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--muted)'}}>{l.details||"—"}</td>
            </tr>
          ))}
        </tbody>
      </table>}
    </section>
  </div>

  :tab==="adminlogs"?<div className="adminGrid">
    <section className="adminTable">
      <div className="adminTableTop"><h2>Журнал действий администраторов</h2><span className="statsMuted">Входы, изменения товаров, коллекций, скидок, заказов и настроек</span></div>
      {adminLogs.length===0?<p className="statsMuted">Действий пока нет</p>:<table className="orderItems">
        <thead><tr><th>Дата</th><th>Администратор</th><th>Действие</th><th>Объект</th><th>ID</th><th>Детали</th></tr></thead>
        <tbody>
          {adminLogs.map((l:any)=>(
            <tr key={l.id}>
              <td style={{whiteSpace:'nowrap'}}>{new Date(l.createdAt).toLocaleString("ru-RU")}</td>
              <td>{l.adminEmail}</td>
              <td><span className={`statusBadge status-${l.action==="DELETE"?"cancelled":l.action==="CREATE"?"new":l.action==="UPLOAD"?"shipped":"processing"}`}>{l.action}</span></td>
              <td>{l.entity}</td>
              <td>{l.entityId||"—"}</td>
              <td style={{maxWidth:340,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--muted)'}}>{l.details||"—"}</td>
            </tr>
          ))}
        </tbody>
      </table>}
    </section>
  </div>

  :<section className="ordersPanel">
    <h2>Заказы</h2>
    <div className="ordersFilters">
      <input type="text" placeholder="Поиск по email или имени" value={filterSearch} onChange={(e)=>setFilterSearch(e.target.value)} />
      <select value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)}>
        <option value="">Все статусы</option>
        {statuses.map(s=><option key={s} value={s}>{statusLabels[s as keyof typeof statusLabels]}</option>)}
      </select>
      <select value={filterPayStatus} onChange={(e)=>setFilterPayStatus(e.target.value)}>
        <option value="">Все платежи</option>
        {payStatuses.map(s=><option key={s} value={s}>{payStatusLabels[s as keyof typeof payStatusLabels]}</option>)}
      </select>
      <input type="date" value={dateRange.from} onChange={(e)=>setDateRange({...dateRange, from: e.target.value})} placeholder="От" />
      <input type="date" value={dateRange.to} onChange={(e)=>setDateRange({...dateRange, to: e.target.value})} placeholder="До" />
    </div>
    <div className="ordersGrid">
      <div className="ordersList">
        {filteredOrders.length === 0 ? (<p>Нет заказов</p>) : (filteredOrders.map(o=>(
          <div key={o.id} className={`orderCard ${selectedOrder?.id === o.id ? 'active' : ''}`} onClick={() => setSelectedOrder(o)}>
            <div className="orderCardHeader">
              <b>№{o.id}</b>
              <span className={`statusBadge status-${o.status.toLowerCase()}`}>{statusLabels[o.status as keyof typeof statusLabels]}</span>
            </div>
            <div className="orderCardContent">
              <p><b>{o.customerName}</b></p>
              <p><small>{o.email}</small></p>
              <p className="orderTotal">{money(o.total)}</p>
              <p><small>{new Date(o.createdAt).toLocaleString("ru-RU")}</small></p>
            </div>
          </div>
        )))}
      </div>
      {selectedOrder && (<div className="orderDetail">
        <div className="orderDetailHeader">
          <h3>Заказ №{selectedOrder.id}</h3>
          <button className="closeBtn" onClick={() => setSelectedOrder(null)}>✕</button>
        </div>
        <div className="orderDetailSection">
          <h4>Информация о покупателе</h4>
          <p><b>Имя:</b> {selectedOrder.customerName}</p>
          <p><b>Email:</b> {selectedOrder.email}</p>
          <p><b>Телефон:</b> {selectedOrder.phone || "—"}</p>
          <p><b>Адрес:</b> {selectedOrder.address || "—"}</p>
          <p><b>Способ доставки:</b> {selectedOrder.deliveryMethod || "—"}</p>
          <p><b>Дата:</b> {new Date(selectedOrder.createdAt).toLocaleString("ru-RU")}</p>
        </div>
        <div className="orderDetailSection">
          <h4>Товары в заказе</h4>
          <table className="orderItems">
            <thead><tr><th>Товар</th><th>Размер</th><th>Кол-во</th><th>Цена</th><th>Сумма</th></tr></thead>
            <tbody>
              {selectedOrder.items.map((item: any) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.size}</td>
                  <td>{item.quantity}</td>
                  <td>{money(item.price)}</td>
                  <td><b>{money(item.price * item.quantity)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="orderTotal">Итого: <b>{money(selectedOrder.total)}</b></div>
          {selectedOrder.discountAmount > 0 && <div className="orderTotal" style={{ color: '#2e7d32' }}>Скидка: −{money(selectedOrder.discountAmount)}{selectedOrder.promoCode ? ` (${selectedOrder.promoCode})` : ''}</div>}
        </div>
        <div className="orderDetailSection">
          <h4>Статусы</h4>
          <div className="statusControls">
            <div>
              <label>Статус заказа</label>
              <select value={selectedOrder.status} onChange={(e)=>updateOrderStatus(selectedOrder.id, e.target.value)}>
                {statuses.map(s=><option key={s} value={s}>{statusLabels[s as keyof typeof statusLabels]}</option>)}
              </select>
            </div>
            <div>
              <label>Статус платежа</label>
              <select value={selectedOrder.paymentStatus} onChange={(e)=>updateOrderStatus(selectedOrder.id, selectedOrder.status, e.target.value)}>
                {payStatuses.map(s=><option key={s} value={s}>{payStatusLabels[s as keyof typeof payStatusLabels]}</option>)}
              </select>
            </div>
          </div>
          <div className="trackingField">
            <label>Трек-номер (отправляется клиенту при статусе «Отправлен»)</label>
            <div className="trackingRow">
              <input
                type="text"
                value={selectedOrder.trackingNumber || ""}
                placeholder="Например, RU1234567890"
                onChange={(e)=>setSelectedOrder({...selectedOrder, trackingNumber: e.currentTarget.value})}
                onBlur={(e)=>saveTracking(selectedOrder.id, e.currentTarget.value)}
              />
              <button
                type="button"
                className="lightButton trackingGenBtn"
                onClick={()=>{
                  const t = generateTrackingNumber(selectedOrder.deliveryMethod);
                  setSelectedOrder({...selectedOrder, trackingNumber: t});
                  saveTracking(selectedOrder.id, t);
                }}
              >
                Сгенерировать
              </button>
            </div>
          </div>
          <p style={{fontSize:12,color:"var(--muted)",marginTop:8}}>
            При переходе в «Отправлен» клиенту уходит письмо с трек-номером, при «Доставлен» — уведомление о готовности к выдаче.
          </p>
        </div>
      </div>)}
    </div>
  </section>}
 </main>
}
