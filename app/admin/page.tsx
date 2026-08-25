"use client";
import {useEffect,useState} from "react";

const money=(n:number)=>new Intl.NumberFormat("ru-RU").format(n)+" ₽";
const statuses=["NEW","PROCESSING","SHIPPED","DELIVERED","COMPLETED","CANCELLED"];
const payStatuses=["PENDING","PAID","FAILED","REFUNDED","CANCELLED"];

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
 const [tab,setTab]=useState("orders"),[products,setProducts]=useState<any[]>([]),[orders,setOrders]=useState<any[]>([]),[cats,setCats]=useState<any[]>([]),[collections,setCollections]=useState<any[]>([]),[discounts,setDiscounts]=useState<any[]>([]),[edit,setEdit]=useState<any>(null),[msg,setMsg]=useState("");
 const [selectedOrder, setSelectedOrder] = useState<any>(null);
 const [filterStatus, setFilterStatus] = useState("");
 const [filterPayStatus, setFilterPayStatus] = useState("");
 const [filterSearch, setFilterSearch] = useState("");
 const [dateRange, setDateRange] = useState({from: "", to: ""});
 const [uploadedImages, setUploadedImages] = useState<any[]>([]);
 const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
 
 const load=async()=>{
  const [p,o,c,cl,d]=await Promise.all([fetch("/api/admin/products"),fetch("/api/admin/orders"),fetch("/api/categories"),fetch("/api/admin/collections"),fetch("/api/admin/discounts")]);
  if(p.status===401){location.href="/admin/login";return}
  setProducts(await p.json());
  setOrders(await o.json());
  setCats(await c.json());
  setCollections(await cl.json());
  setDiscounts(await d.json());
 };
 
 useEffect(()=>{load()},[]);
 
 useEffect(()=>{
  if(edit && tab==="collections"){
    const selected = new Set(edit.products?.map((cp:any)=>cp.productId)||[]);
    setSelectedProducts(selected);
  }
 },[edit,tab]);

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

 async function save(e:any){
  e.preventDefault();
  const b=Object.fromEntries(new FormData(e.currentTarget).entries());
  
  if(tab === "collections") {
    const productIds = Array.from(selectedProducts);
    const url=edit?.id?`/api/admin/collections/${edit.id}`:"/api/admin/collections";
    const payload={name:b.name,slug:b.slug,description:b.description,image:b.image||"",sortOrder:Number(b.sortOrder||0),productIds};
    
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
  
  const variants=(edit?.variants||[]).map((v:any)=>({...v,stock:Number((e.currentTarget.elements[`stock_${v.id}`] as HTMLInputElement)?.value||v.stock)}));
  const imageUrls = [...(uploadedImages || []), ...(b.images||"").split("\n").map((x:string)=>x.trim()).filter(Boolean)];
  const url=edit?.id?`/api/admin/products/${edit.id}`:"/api/admin/products";
  const payload={...b,price:Number(b.price),categoryId:Number(b.categoryId),variants,images:imageUrls};
  
  const r=await fetch(url,{method:edit?.id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const d=await r.json();
  if(!r.ok){setMsg(d.error||"Ошибка");return}
  setEdit(null);
  setUploadedImages([]);
  setMsg("Товар сохранён");
  load();
 }
 
 async function del(id:number, type:string){if(!confirm("Удалить?"))return;await fetch(`/api/admin/${type}/${id}`,{method:"DELETE"});load()}
 
 async function updateOrderStatus(id:number, status:string, payStatus?: string) {
  const payload: any = { status };
  if(payStatus) payload.paymentStatus = payStatus;
  const r = await fetch(`/api/admin/orders/${id}`, {method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)});
  if(r.ok) {
    setMsg("Статус обновлён");
    load();
    if(selectedOrder) setSelectedOrder({...selectedOrder, status});
  }
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
 
 const stats = {
  total: orders.length,
  new: orders.filter(o => o.status === "NEW").length,
  completed: orders.filter(o => o.status === "COMPLETED").length,
  revenue: orders.reduce((s, o) => s + o.total, 0),
  avgOrder: Math.round(orders.reduce((s, o) => s + o.total, 0) / (orders.length || 1))
 };

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
    <div><b>{stats.total}</b><span>всего заказов</span></div>
    <div><b>{stats.new}</b><span>новых</span></div>
    <div><b>{collections.length}</b><span>коллекций</span></div>
    <div><b>{discounts.length}</b><span>скидок</span></div>
    <div><b>{money(stats.revenue)}</b><span>выручка</span></div>
  </div>

  <div className="adminTabs">
    <button className={tab==="products"?"active":""} onClick={()=>setTab("products")}>Товары ({products.length})</button>
    <button className={tab==="collections"?"active":""} onClick={()=>setTab("collections")}>Коллекции ({collections.length})</button>
    <button className={tab==="discounts"?"active":""} onClick={()=>setTab("discounts")}>Скидки ({discounts.length})</button>
    <button className={tab==="orders"?"active":""} onClick={()=>setTab("orders")}>Заказы ({orders.length})</button>
  </div>

  {tab==="products"?<div className="adminGrid">
    <section className="adminTable">
      <div className="adminTableTop"><h2>Каталог</h2><button className="darkButton" onClick={()=>{setEdit({id:0,name:"",slug:"",price:0,color:"",tone:"linen",categoryId:cats[0]?.id||1,source:"",sourceUrl:"",description:"",images:[],variants:[]});setUploadedImages([]);}}>+ Новый товар</button></div>
      {products.map(p=><div className="adminProduct" key={p.id}><div className={`adminThumb ${p.tone}`}>{p.images?.[0]?.url?<img src={p.images[0].url} alt=""/>:"N"}</div><div><b>{p.name}</b><small>{p.category.name} · {p.color} · {p.variants.reduce((a:any,v:any)=>a+v.stock,0)} шт. · {p.images.length} фото</small>{p.source&&<em>{p.source}</em>}</div><strong>{money(p.price)}</strong><div className="adminActions"><button onClick={()=>{setEdit(p);setUploadedImages([]);}}>Изменить</button><button onClick={()=>del(p.id,"products")}>Удалить</button></div></div>)}
    </section>
    <form className="adminForm" onSubmit={save}><h2>{edit?edit.id?"Редактирование":"Новый товар":"Выберите товар"}</h2>{edit&&<><label>Название<input name="name" defaultValue={edit.name} required/></label><label>Slug<input name="slug" defaultValue={edit.slug} required/></label><label>Цена<input name="price" type="number" defaultValue={edit.price} required/></label><label>Цвет<input name="color" defaultValue={edit.color} required/></label><label>Тон карточки<input name="tone" defaultValue={edit.tone} required/></label><label>Категория<select name="categoryId" defaultValue={edit.categoryId}>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Источник<input name="source" defaultValue={edit.source||""}/></label><label>Ссылка на источник<input name="sourceUrl" defaultValue={edit.sourceUrl||""}/></label><div style={{marginTop: '15px'}}><label style={{display: 'block', marginBottom: '8px', fontSize: '11px', color: 'var(--muted)'}}>Загрузить фото</label><input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{display: 'block', width: '100%', marginBottom: '12px', padding: '8px', border: '1px solid var(--line)'}}/>{(uploadedImages.length > 0 || edit.images?.length > 0) && (<div style={{marginBottom: '15px'}}><label style={{display: 'block', marginBottom: '8px', fontSize: '11px', color: 'var(--muted)'}}>Текущие фото ({(uploadedImages.length + (edit.images?.length || 0))})</label><div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px'}}>{uploadedImages.map((url, idx) => (<div key={idx} style={{position: 'relative', paddingBottom: '100%'}}><img src={url} alt="uploaded" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '3px', border: '2px solid #4CAF50'}}/><button type="button" onClick={() => setUploadedImages(uploadedImages.filter((_, i) => i !== idx))} style={{position: 'absolute', top: '2px', right: '2px', background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '10px'}}>✕</button></div>))}{edit.images?.map((img: any, idx: number) => (<div key={`existing-${idx}`} style={{position: 'relative', paddingBottom: '100%'}}><img src={img.url} alt="existing" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '3px'}}/></div>))}</div></div>)}</div><label>Дополнительные ссылки на фото (по одной в строке)<textarea name="images" defaultValue={(edit.images||[]).filter((i:any) => !uploadedImages.includes(i.url)).map((i:any)=>i.url).join("\n")} placeholder="https://...jpg"/></label><label>Описание<textarea name="description" defaultValue={edit.description||""}/></label><div className="variantsSection"><b className="formLabel">Остатки по размерам</b><div className="variantsList">{edit.variants?.map((v:any)=><label key={v.id} className="variantLabel"><span>{v.size}</span><input name={`stock_${v.id}`} type="number" min="0" defaultValue={v.stock}/></label>)}</div></div><div className="formButtons"><button className="darkButton">Сохранить</button><button type="button" onClick={()=>{setEdit(null);setUploadedImages([]);}}>Отмена</button></div>{msg&&<small>{msg}</small>}</>}</form>
  </div>

  :tab==="collections"?<div className="adminGrid">
    <section className="adminTable">
      <div className="adminTableTop"><h2>Коллекции</h2><button className="darkButton" onClick={()=>{setEdit({id:0,name:"",slug:"",description:"",image:"",sortOrder:0,products:[]});setSelectedProducts(new Set());}}>+ Новая коллекция</button></div>
      {collections.map(c=><div className="adminProduct" key={c.id}><div className="adminThumb" style={{background:'#d5c7b5'}}>{c.image?<img src={c.image} alt=""/>:"C"}</div><div><b>{c.name}</b><small>{c.products.length} товаров · {c.active?"Активна":"Не активна"}</small>{c.description&&<em>{c.description}</em>}</div><strong>{c.products.length}</strong><div className="adminActions"><button onClick={()=>{setEdit(c);const selected=new Set(c.products?.map((cp:any)=>cp.productId)||[]);setSelectedProducts(selected);}}>Редактировать</button><button onClick={()=>del(c.id,"collections")}>Удалить</button></div></div>)}
    </section>
    <form className="adminForm" onSubmit={save}><h2>{edit?edit.id?"Редактирование коллекции":"Новая коллекция":"Выберите коллекцию"}</h2>{edit&&<><label>Название<input name="name" defaultValue={edit.name} required/></label><label>Slug<input name="slug" defaultValue={edit.slug} required/></label><label>Описание<textarea name="description" defaultValue={edit.description||""}/></label><label>Изображение<input name="image" defaultValue={edit.image||""} placeholder="https://...jpg"/></label><label>Порядок сортировки<input name="sortOrder" type="number" defaultValue={edit.sortOrder||0}/></label><label style={{marginBottom:'12px'}}>Товары в коллекции ({selectedProducts.size} выбрано):</label><div style={{border:'1px solid var(--line)',borderRadius:'4px',maxHeight:'300px',overflowY:'auto',padding:'12px',background:'#fafaf9',marginBottom:'15px'}}>{products.length===0?<p style={{margin:0,color:'var(--muted)',fontSize:'12px'}}>Нет товаров</p>:products.map(p=><div key={p.id} style={{display:'flex',alignItems:'center',padding:'8px',marginBottom:'6px',background:'#fff',borderRadius:'3px',border:'1px solid transparent',cursor:'pointer',transition:'.2s',borderColor:selectedProducts.has(p.id)?'var(--ink)':'transparent'}} onClick={()=>{const newSet=new Set(selectedProducts);if(newSet.has(p.id)){newSet.delete(p.id)}else{newSet.add(p.id)}setSelectedProducts(newSet);}}><input type="checkbox" checked={selectedProducts.has(p.id)} onChange={()=>{}} style={{marginRight:'10px',width:'16px',height:'16px',cursor:'pointer'}}/><div style={{flex:1}}><div style={{fontSize:'13px',color:'#1c1b19',fontWeight:'500'}}>{p.name}</div><small style={{color:'var(--muted)',fontSize:'11px'}}>{p.color} · {money(p.price)}</small></div></div>)}</div><div className="formButtons"><button className="darkButton">Сохранить</button><button type="button" onClick={()=>{setEdit(null);setSelectedProducts(new Set());}}>Отмена</button></div>{msg&&<small style={{display:'block',marginTop:'10px'}}>{msg}</small>}</>}</form>
  </div>

  :tab==="discounts"?<div className="adminGrid">
    <section className="adminTable">
      <div className="adminTableTop"><h2>Скидки</h2><button className="darkButton" onClick={()=>setEdit({id:0,code:"",description:"",type:"PERCENT",value:0,maxUses:null,active:true,productId:null,collectionId:null,startsAt:"",expiresAt:""})}>+ Новая скидка</button></div>
      {discounts.map(d=><div className="adminProduct" key={d.id}><div style={{padding:'10px',background:d.active?'#d5cec0':'#f0f0f0',borderRadius:'4px',color:'#1c1b19',fontWeight:'bold',textAlign:'center'}}>{d.value}{d.type==="PERCENT"?"%":"₽"}</div><div><b>{d.code}</b><small>{d.product?`На товар: ${d.product.name}`:d.collection?`На коллекцию: ${d.collection.name}`:"Универсальная"} · {d.active?"Активна":"Не активна"}</small>{d.description&&<em>{d.description}</em>}</div><strong>{d.usedCount}/{d.maxUses||"∞"}</strong><div className="adminActions"><button onClick={()=>setEdit(d)}>Редактировать</button><button onClick={()=>del(d.id,"discounts")}>Удалить</button></div></div>)}
    </section>
    <form className="adminForm" onSubmit={save}><h2>{edit?edit.id?"Редактирование скидки":"Новая скидка":"Выберите скидку"}</h2>{edit&&<><label>Код<input name="code" defaultValue={edit.code} required placeholder="SUMMER20"/></label><label>Описание<textarea name="description" defaultValue={edit.description||""} placeholder="Скидка 20% на летнюю коллекцию"/></label><label>Тип<select name="type" defaultValue={edit.type}><option value="PERCENT">Процент %</option><option value="FIXED">Фиксированная сумма ₽</option></select></label><label>Значение<input name="value" type="number" defaultValue={edit.value} required/></label><label>Макс использований<input name="maxUses" type="number" placeholder="Без ограничений" defaultValue={edit.maxUses||""}/></label><label>На товар<select name="productId"><option value="">Не выбран</option>{products.map(p=><option key={p.id} value={p.id} selected={edit.productId===p.id}>{p.name}</option>)}</select></label><label>На коллекцию<select name="collectionId"><option value="">Не выбрана</option>{collections.map(c=><option key={c.id} value={c.id} selected={edit.collectionId===c.id}>{c.name}</option>)}</select></label><label>Начало действия<input name="startsAt" type="datetime-local" defaultValue={edit.startsAt||""}/></label><label>Конец действия<input name="expiresAt" type="datetime-local" defaultValue={edit.expiresAt||""}/></label><label><input type="checkbox" name="active" defaultChecked={edit.active}/>Активна</label><div className="formButtons"><button className="darkButton">Сохранить</button><button type="button" onClick={()=>setEdit(null)}>Отмена</button></div>{msg&&<small>{msg}</small>}</>}</form>
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
        </div>
      </div>)}
    </div>
  </section>}
 </main>
}
