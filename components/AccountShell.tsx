"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AccountSidebar from "@/components/AccountSidebar";
import AccountLogin from "@/components/AccountLogin";
import type { OrderView } from "@/lib/orderViews";

export type Viewer = {
  id: number;
  email: string;
  role: string;
  name?: string | null;
  phone?: string | null;
  bonusBalance?: number;
  createdAt?: string;
} | null;

export default function AccountShell({
  children,
  pageTitle,
  eyebrow = "NELLA PREMIUM",
}: {
  children: React.ReactNode | ((data: { user: Viewer; orders: OrderView[] }) => React.ReactNode);
  pageTitle: string;
  eyebrow?: string;
}) {
  const [user, setUser] = useState<Viewer>(null);
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unauth, setUnauth] = useState(false);
  const router = useRouter();

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/account")
      .then(async r => {
        if (r.status === 401) {
          setUnauth(true);
          return { user: null, orders: [], wishlistCount: 0 };
        }
        setUnauth(false);
        return r.json();
      })
      .then(d => {
        setUser(d.user);
        setOrders(d.orders || []);
        setWishlistCount(d.wishlistCount || 0);
      })
      .catch(() => setUnauth(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <main className="accountPage">
        <div className="accountWrap">
          <p className="accMuted">Загрузка…</p>
        </div>
      </main>
    );
  }

  if (unauth || !user) {
    return (
      <main className="accountPage">
        <div className="accountWrap">
          <div className="loginWrap" style={{ maxWidth: 480, margin: "40px auto" }}>
            <AccountLogin onSuccess={load} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="accountPage">
      <div className="accountWrap">
        <div className="accLayout">
          <AccountSidebar
            user={user}
            orderCount={orders.length}
            onSignOut={() => {
              setUser(null);
              setOrders([]);
              router.refresh();
            }}
          />
          <div className="accContent">
            <div className="accountHead">
              <div>
                <span className="eyebrow">{eyebrow}</span>
                <h1>{pageTitle}</h1>
              </div>
            </div>
            {typeof children === "function"
              ? children({ user, orders })
              : children}
          </div>
        </div>
      </div>
    </main>
  );
}
