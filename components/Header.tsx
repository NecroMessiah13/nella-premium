"use client";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "./Cart";
import { SearchIcon, HeartIcon, CartIcon, MenuIcon, CloseIcon } from "./Icons";

export function Header() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();

  return (
    <header className="siteHeader">
      <button 
        className="mobileMenu" 
        onClick={() => setOpen(!open)} 
        aria-label="Меню"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1c1b19' }}
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
        <button aria-label="Поиск" title="Поиск" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1c1b19' }}>
          <SearchIcon size={20} />
        </button>
        <button aria-label="Избранное" title="Избранное" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1c1b19' }}>
          <HeartIcon size={20} />
        </button>
        <Link href="/cart" className="cartIcon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1c1b19', textDecoration: 'none' }}>
          <CartIcon size={20} count={count} />
        </Link>
      </div>
    </header>
  );
}
