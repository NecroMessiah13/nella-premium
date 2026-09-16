"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useCart } from "./Cart";
import { SearchIcon, HeartIcon, CartIcon, MenuIcon, CloseIcon, UserIcon } from "./Icons";

export function Header() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const { count } = useCart();

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => (r.ok ? r.json() : { user: null }))
      .then(d => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  return (
    <header className="siteHeader">
      <button 
        className="mobileMenu" 
        onClick={() => setOpen(!open)} 
        aria-label="Меню"
        style={{ alignItems: 'center', justifyContent: 'center', color: '#1c1b19' }}
      >
        {open ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
      </button>
      
      <Link href="/" className="brand">Nella Premium<span>швейный бренд</span></Link>
      
      <nav className={open ? "nav open" : "nav"}>
        <Link href="/catalog" onClick={() => setOpen(false)}>Каталог</Link>
        <a href="/#collections" onClick={() => setOpen(false)}>Коллекции</a>
        <a href="/#about" onClick={() => setOpen(false)}>О бренде</a>
        <a href="/#delivery" onClick={() => setOpen(false)}>Доставка</a>
        <a href="/#contacts" onClick={() => setOpen(false)}>Контакты</a>
      </nav>
      
      <div className="headerActions">
        <Link href="/catalog" aria-label="Поиск" title="Поиск" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1c1b19', textDecoration: 'none' }}>
          <SearchIcon size={20} />
        </Link>
        <Link href="/wishlist" aria-label="Избранное" title="Избранное" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1c1b19', textDecoration: 'none' }}>
          <HeartIcon size={20} />
        </Link>
        <Link href="/account" className="cartIcon userIcon" title={user ? "Личный кабинет" : "Вход"} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1c1b19', textDecoration: 'none' }}>
          <UserIcon size={20} />
          {user && <i className="userDot" />}
        </Link>
        <Link href="/cart" className="cartIcon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1c1b19', textDecoration: 'none' }}>
          <CartIcon size={20} count={count} />
        </Link>
      </div>
    </header>
  );
}
