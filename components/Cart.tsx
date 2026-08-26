'use client';
import {createContext, useContext, useEffect, useState} from 'react';
import {Product} from '@/lib/products';

type CartItem = Product & {qty: number; size: string};
type Ctx = {
  items: CartItem[];
  count: number;
  total: number;
  add: (p: Product, size: string) => void;
  remove: (slug: string) => void;
  clear: () => void;
  showDrawer: boolean;
  setShowDrawer: (show: boolean) => void;
};

const C = createContext<Ctx | null>(null);

export function CartProvider({children}: {children: React.ReactNode}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    const x = localStorage.getItem('nella-cart');
    if(x) setItems(JSON.parse(x));
  }, []);

  useEffect(() => {
    localStorage.setItem('nella-cart', JSON.stringify(items));
  }, [items]);

  const add = (p: Product, size: string) => {
    setItems(a => {
      const f = a.find(x => x.slug === p.slug && x.size === size);
      const updated = f 
        ? a.map(x => x.slug === p.slug && x.size === size ? {...x, qty: x.qty + 1} : x)
        : [...a, {...p, size, qty: 1}];
      
      // Открыть drawer после добавления
      setShowDrawer(true);
      return updated;
    });
  };

  const remove = (slug: string, size: string) => setItems(a => a.flatMap(x => (x.slug === slug && x.size === size) ? (x.qty > 1 ? [{...x, qty: x.qty - 1}] : []) : [x]));

  return (
    <C.Provider value={{
      items,
      count: items.reduce((s, x) => s + x.qty, 0),
      total: items.reduce((s, x) => s + x.price * x.qty, 0),
      add,
      remove,
      clear: () => setItems([]),
      showDrawer,
      setShowDrawer
    }}>
      {children}
    </C.Provider>
  );
}

export const useCart = () => {
  const c = useContext(C);
  if(!c) throw Error('CartProvider missing');
  return c;
};
