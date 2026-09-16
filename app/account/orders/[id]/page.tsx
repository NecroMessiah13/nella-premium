"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import {
  STATUS_LABEL,
  STATUS_BADGE,
  PAYMENT_LABEL,
  DELIVERY_LABEL,
  ORDER_STEPS,
  STEP_LABELS,
  money,
  formatDate,
  formatDateTime,
} from "@/lib/orderViews";

export default function AccountOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);

  return (
    <AccountShell pageTitle={`Заказ №${orderId}`}>
      {({ orders }) => {
        const order = orders.find(o => o.id === orderId);

        if (!order) {
          return (
            <div className="accCard accEmpty">
              <p className="accMuted">Заказ не найден.</p>
              <Link href="/account/orders" className="darkButton">← К списку заказов</Link>
            </div>
          );
        }

        const itemsTotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
        const deliveryCost = order.deliveryCost ?? Math.max(0, order.total - itemsTotal);
        const step = ORDER_STEPS[order.status] ?? 0;
        const cancelled = order.status === "CANCELLED";

        return (
          <div className="accOrderDetail">
            <Link href="/account/orders" className="accBack">← Все заказы</Link>

            {/* Шапка статуса */}
            <div className="accOdHead">
              <div>
                <div className="accOdTitle">
                  <h2>Заказ №{order.id}</h2>
                  <span className={`obadge obadge-${STATUS_BADGE[order.status] || "new"}`}>
                    {STATUS_LABEL[order.status] || order.status}
                  </span>
                </div>
                <p className="accMuted">
                  Оформлен {formatDateTime(order.createdAt)}
                </p>
              </div>
              <div className="accOdAmount">
                <span>Итого</span>
                <b>{money(order.total)}</b>
              </div>
            </div>

            {/* Прогресс */}
            {!cancelled ? (
              <section className="accCard">
                <h3>Статус доставки</h3>
                <div className="accSteps">
                  {STEP_LABELS.map((label, i) => (
                    <div
                      key={label}
                      className={`accStep${i <= step ? " done" : ""}${
                        i === step && order.status !== "DELIVERED" && order.status !== "COMPLETED"
                          ? " current"
                          : ""
                      }`}
                    >
                      <div className="accStepDot">
                        {i < step || (order.status === "DELIVERED" || order.status === "COMPLETED") && i <= step ? "✓" : i + 1}
                      </div>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <p className="accMuted accStepHint">
                  {order.status === "NEW" && "Заказ принят и ожидает обработки менеджером."}
                  {order.status === "PROCESSING" && "Мы комплектуем ваш заказ. Обычно это занимает не более 1 дня."}
                  {order.status === "SHIPPED" && "Заказ передан в доставку. Трек-номер ниже для отслеживания."}
                  {order.status === "DELIVERED" && "Заказ доставлен. Спасибо за покупку в Nella Premium!"}
                  {order.status === "COMPLETED" && "Заказ завершён. Спасибо за покупку в Nella Premium!"}
                </p>
              </section>
            ) : (
              <section className="accCard accCancelled">
                <h3>Заказ отменён</h3>
                <p className="accMuted">
                  Этот заказ был отменён. Если вы оплатили его — деньги вернутся на счёт в ближайшее время.
                </p>
              </section>
            )}

            <div className="accOdGrid">
              {/* Товары */}
              <section className="accCard">
                <h3>Состав заказа</h3>
                <div className="accOdItems">
                  {order.items.map(it => (
                    <div className="accOdItem" key={it.id}>
                      <div className="accOdItemSw">{it.color[0]?.toUpperCase() || "#"}</div>
                      <div className="accOdItemInfo">
                        <b>{it.name}</b>
                        <span className="accMuted">
                          {it.size} · {it.color} · {it.quantity} шт.
                        </span>
                      </div>
                      <div className="accOdItemPrice">{money(it.price * it.quantity)}</div>
                    </div>
                  ))}
                </div>

                <div className="accOdTotals">
                  <div><span>Товары</span><span>{money(itemsTotal)}</span></div>
                  <div><span>Доставка</span><span>{deliveryCost > 0 ? money(deliveryCost) : "Бесплатно"}</span></div>
                  {order.discountAmount > 0 && (
                    <div style={{ color: '#2e7d32' }}><span>Скидка</span><span>−{money(order.discountAmount)}{order.promoCode ? ` (${order.promoCode})` : ''}</span></div>
                  )}
                  <div className="accOdTotalLine"><span>Итого</span><b>{money(order.total)}</b></div>
                  {order.bonusEarned ? (
                    <div className="accOdBonus">+ {order.bonusEarned} бонусов за заказ</div>
                  ) : null}
                </div>
              </section>

              {/* Информация о доставке и оплате */}
              <div className="accOdSide">
                <section className="accCard">
                  <h3>Доставка</h3>
                  <dl className="accDl">
                    <dt>Способ</dt>
                    <dd>{DELIVERY_LABEL[order.deliveryMethod] || order.deliveryMethod}</dd>
                    {order.trackingNumber && (
                      <>
                        <dt>Трек-номер</dt>
                        <dd className="accTrackNo">{order.trackingNumber}</dd>
                      </>
                    )}
                    {order.address && (
                      <>
                        <dt>Адрес</dt>
                        <dd>{order.address}</dd>
                      </>
                    )}
                    {order.phone && (
                      <>
                        <dt>Телефон</dt>
                        <dd>{order.phone}</dd>
                      </>
                    )}
                  </dl>
                </section>

                <section className="accCard">
                  <h3>Оплата</h3>
                  <dl className="accDl">
                    <dt>Статус</dt>
                    <dd>
                      <span className={`pbadge pbadge-${order.paymentStatus === "PAID" ? "paid" : "pending"}`}>
                        {PAYMENT_LABEL[order.paymentStatus] || order.paymentStatus}
                      </span>
                    </dd>
                    <dt>Сумма</dt>
                    <dd className="accStrong">{money(order.total)}</dd>
                  </dl>
                  {order.paymentStatus === "PENDING" && (
                    <Link href={`/api/payments/create?orderId=${order.id}`} className="darkButton fullButton">
                      Оплатить заказ
                    </Link>
                  )}
                </section>
              </div>
            </div>
          </div>
        );
      }}
    </AccountShell>
  );
}
