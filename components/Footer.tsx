import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="siteFooter">
      <div className="footerTop">
        <Link href="/" className="footerBrand">Nella Premium<span>швейный бренд</span></Link>
        <nav className="footerNav" aria-label="Нижнее меню">
          <Link href="/catalog">Каталог</Link>
          <a href="/#collections">Коллекции</a>
          <a href="/#about">О бренде</a>
          <a href="/#delivery">Доставка</a>
          <a href="/#contacts">Контакты</a>
        </nav>
        <div className="footerContacts">
          <a href="tel:+79331820414">+7 933 182-04-14</a>
          <a href="mailto:hello@nella.premium">hello@nella.premium</a>
        </div>
      </div>
      <div className="footerBottom">
        <span>&copy; {year} Nella Premium. Все права защищены.</span>
        <span>ИНН 262515338197 &middot; ОГРНИП 313265108100188</span>
      </div>
    </footer>
  );
}