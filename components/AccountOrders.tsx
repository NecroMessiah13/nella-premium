"use client";
import Link from "next/link";

type OrderItemView = {
  id: number;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
};

export type OrderView = {
  id: number;
  createdAt: string;
  status: string;
  paymentStatus: string;
  total: number;
  deliveryMethod: string;
  trackingNumber?: string | null;
  items: OrderItemView[];
};

const STATUS_LABEL: Record<string, string> = {
  NEW: "Новый",
  PROCESSING: "В обработке",
  SHIPPED: "Отправлен",
  DELIVERED: "Доставлен",
  COMPLETED: "Завершён",
  CANCELLED: "Отменён",
};

const PAYMENT_LABEL: Record<string, string> = {
  PENDING: "Ожидает оплаты",
  PAID: "Оплачен",
  FAILED: "Не прошла",
  REFUNDED: "Возврат",
  CANCELLED: "Отменён",
};

const DELIVERY_LABEL: Record<string, string> = {
  COURIER: "Курьер",
  PICKUP: "Самовывоз",
  MAIL: "Почта",
  CDEK: "СДЭК",
  OZON: "Ozon",
};

const ORDER_BADGE: Record<string, string> = {
  NEW: "new",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const PAY_BADGE: Record<string, string> = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
};

const money = (n: number) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";

export default function AccountOrders({ orders }: { orders: OrderView[] }) {
  return (
    <div className="accountOrders">
      {orders.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>
          У вас пока нет заказов.{" "}
          <Link href="/catalog">Перейти в каталог →</Link>
        </p>
      ) : (
        orders.map(o => (
          <div className="accountOrder" key={o.id}>
            <div className="accountOrderHead">
              <b>Заказ №{o.id}</b>
              <span className={`obadge obadge-${ORDER_BADGE[o.status] || "new"}`}>
                {STATUS_LABEL[o.status] || o.status}
              </span>
            </div>
            <div className="accountOrderMeta">
              <span>{new Date(o.createdAt).toLocaleDateString("ru-RU")}</span>
              <span>{DELIVERY_LABEL[o.deliveryMethod] || o.deliveryMethod}</span>
              {o.trackingNumber && (
                <span className="orderTrack">трек: <b>{o.trackingNumber}</b></span>
              )}
            </div>
            <table className="accountOrderTable">
              <thead>
                <tr><th>Товар</th><th>Размер</th><th>Кол-во</th><th className="right">Сумма</th></tr>
              </thead>
              <tbody>
                {o.items.map(it => (
                  <tr key={it.id}>
                    <td>{it.name}</td>
                    <td>{it.size}</td>
                    <td>{it.quantity}</td>
                    <td className="right">{money(it.price * it.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="accountOrderFoot">
              <span className={`pbadge pbadge-${PAY_BADGE[o.paymentStatus] || "pending"}`}>
                {PAYMENT_LABEL[o.paymentStatus] || o.paymentStatus}
              </span>
              <div className="accountOrderTotal">
                Итого: <b>{money(o.total)}</b>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}