"use client";
import { useState } from "react";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import {
  STATUS_LABEL,
  STATUS_BADGE,
  PAYMENT_LABEL,
  DELIVERY_LABEL,
  money,
  formatDate,
  type OrderView,
} from "@/lib/orderViews";

type Filter = "all" | "active" | "delivered" | "cancelled";

export default function AccountOrdersPage() {
  const [filter, setFilter] = useState<Filter>("all");

  return (
    <AccountShell pageTitle="Мои заказы">
      {({ orders }) => {
        const filtered = orders.filter(o => {
          if (filter === "active")
            return o.status !== "DELIVERED" && o.status !== "COMPLETED" && o.status !== "CANCELLED";
          if (filter === "delivered")
            return o.status === "DELIVERED" || o.status === "COMPLETED";
          if (filter === "cancelled") return o.status === "CANCELLED";
          return true;
        });

        return (
          <div className="accOrdersPage">
            <div className="accFilterBar">
              {(
                [
                  ["all", "Все"],
                  ["active", "В работе"],
                  ["delivered", "Доставленные"],
                  ["cancelled", "Отменённые"],
                ] as [Filter, string][]
              ).map(([key, label]) => {
                const count =
                  key === "all"
                    ? orders.length
                    : orders.filter(o => {
                        if (key === "active")
                          return o.status !== "DELIVERED" && o.status !== "COMPLETED" && o.status !== "CANCELLED";
                        if (key === "delivered")
                          return o.status === "DELIVERED" || o.status === "COMPLETED";
                        return o.status === "CANCELLED";
                      }).length;
                return (
                  <button
                    key={key}
                    className={`accFilterBtn${filter === key ? " active" : ""}`}
                    onClick={() => setFilter(key)}
                  >
                    {label}
                    <span className="accFilterCount">{count}</span>
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <div className="accCard accEmpty">
                <p className="accMuted">Здесь пока пусто.</p>
                <Link href="/catalog" className="darkButton">Перейти в каталог</Link>
              </div>
            ) : (
              <div className="accOrdersList">
                {filtered.map(o => (
                  <OrderCard key={o.id} order={o} />
                ))}
              </div>
            )}
          </div>
        );
      }}
    </AccountShell>
  );
}

function OrderCard({ order }: { order: OrderView }) {
  const items = order.items;
  const firstItem = items[0];
  const extraCount = items.length - 1;

  return (
    <Link href={`/account/orders/${order.id}`} className="accOrderCard">
      <div className="accOrderPhoto">
        {firstItem ? (
          <span>{firstItem.name.slice(0, 3).toUpperCase()}</span>
        ) : (
          <span>NELLA</span>
        )}
      </div>

      <div className="accOrderMain">
        <div className="accOrderRow1">
          <b>Заказ №{order.id}</b>
          <span className={`obadge obadge-${STATUS_BADGE[order.status] || "new"}`}>
            {STATUS_LABEL[order.status] || order.status}
          </span>
        </div>
        <div className="accOrderRow2 accMuted">
          <span>{formatDate(order.createdAt)}</span>
          <span>·</span>
          <span>{DELIVERY_LABEL[order.deliveryMethod] || order.deliveryMethod}</span>
          <span>·</span>
          <span>
            {items.reduce((s, i) => s + i.quantity, 0)} шт
          </span>
        </div>
        <div className="accOrderRow3">
          <span className={`pbadge pbadge-${order.paymentStatus === "PAID" ? "paid" : "pending"}`}>
            {PAYMENT_LABEL[order.paymentStatus] || order.paymentStatus}
          </span>
          {order.trackingNumber && (
            <span className="accTrack">
              Трек: <b>{order.trackingNumber}</b>
            </span>
          )}
        </div>
      </div>

      <div className="accOrderRight">
        <div className="accOrderSum">
          {money(order.total)}
          {extraCount > 0 && <small>ещё {extraCount} поз.</small>}
        </div>
        <span className="accOrderArrow">→</span>
      </div>
    </Link>
  );
}
