"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Viewer = {
  id: number;
  email: string;
  role: string;
  name?: string | null;
  phone?: string | null;
} | null;

export default function AccountSidebar({
  user,
  onSignOut,
  orderCount,
}: {
  user: Viewer;
  onSignOut?: () => void;
  orderCount?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/user/logout", { method: "POST" });
    if (onSignOut) onSignOut();
    else router.push("/account");
  }

  const items = [
    { href: "/account", label: "Обзор", icon: "▦" },
    { href: "/account/orders", label: "Мои заказы", icon: "◈", count: orderCount },
    { href: "/account/addresses", label: "Адресная книга", icon: "⌂" },
    { href: "/account/profile", label: "Личные данные", icon: "●" },
  ];

  const isActive = (href: string) =>
    href === "/account" ? pathname === "/account" : pathname.startsWith(href);

  return (
    <aside className="accSide">
      <div className="accSideUser">
        <div className="accSideAvatar">
          {(user?.name || user?.email || "?")[0].toUpperCase()}
        </div>
        <div className="accSideName">
          <b>{user?.name || "Клиент"}</b>
          <span>{user?.email}</span>
        </div>
      </div>

      <nav className="accSideNav">
        {items.map(it => (
          <Link
            key={it.href}
            href={it.href}
            className={`accSideLink${isActive(it.href) ? " active" : ""}`}
          >
            <span className="accSideIcon">{it.icon}</span>
            <span className="accSideLabel">{it.label}</span>
            {typeof it.count === "number" && it.count > 0 && (
              <span className="accSideCount">{it.count}</span>
            )}
          </Link>
        ))}
      </nav>

      <button className="accSideSignout" onClick={signOut}>
        Выйти
      </button>
    </aside>
  );
}
