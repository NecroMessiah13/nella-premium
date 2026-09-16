"use client";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import {
  STATUS_LABEL,
  STATUS_BADGE,
  PAYMENT_LABEL,
  DELIVERY_LABEL,
  money,
  formatDate,
} from "@/lib/orderViews";

export default function AccountPage() {
  return (
    <AccountShell pageTitle="Личный кабинет">
      {({ user, orders }) => {
        const active = orders.filter(o => o.status !== "CANCELLED").filter(o => o.status !== "DELIVERED" && o.status !== "COMPLETED");
        const delivered = orders.filter(o => o.status === "DELIVERED" || o.status === "COMPLETED");
        const totalSpent = orders
          .filter(o => o.paymentStatus === "PAID")
          .reduce((s, o) => s + o.total, 0);
        const recent = orders.slice(0, 4);
        const activeOrder = orders.find(o => o.status === "PROCESSING" || o.status === "SHIPPED" || o.status === "NEW");

        return (
          <div className="accDash">
            {/* Приветствие */}
            <div className="accWelcome">
              <div>
                <h2>Здравствуйте, {user?.name || "дорогой клиент"}!</h2>
                <p className="accMuted">
                  Рады видеть вас в личном кабинете Nella Premium.
                </p>
              </div>
              <Link href="/catalog" className="darkButton">Перейти к покупкам</Link>
            </div>

            {/* Статистика */}
            <div className="accStats">
              <div className="accStat">
                <span className="accStatIcon">◈</span>
                <div>
                  <b>{orders.length}</b>
                  <span>Всего заказов</span>
                </div>
              </div>
              <div className="accStat">
                <span className="accStatIcon">↗</span>
                <div>
                  <b>{active.length}</b>
                  <span>В работе</span>
                </div>
              </div>
              <div className="accStat">
                <span className="accStatIcon">✚</span>
                <div>
                  <b>{delivered.length}</b>
                  <span>Доставлено</span>
                </div>
              </div>
              <div className="accStat">
                <span className="accStatIcon">↗</span>
                <div>
                  <b>{money(totalSpent)}</b>
                  <span>Потрачено (оплачено)</span>
                </div>
              </div>
            </div>

            <div className="accDashGrid">
              {/* Текущий заказ */}
              <section className="accCard" style={{ gridColumn: "1 / -1" }}>
                <div className="accCardHead">
                  <h3>Текущий заказ</h3>
                  {activeOrder && (
                    <Link href={`/account/orders/${activeOrder.id}`} className="accLink">
                      Подробнее →
                    </Link>
                  )}
                </div>
                {activeOrder ? (
                  <div className="accActiveOrder">
                    <div className="accActiveOrderTop">
                      <b>Заказ №{activeOrder.id}</b>
                      <span
                        className={`obadge obadge-${STATUS_BADGE[activeOrder.status] || "new"}`}
                      >
                        {STATUS_LABEL[activeOrder.status] || activeOrder.status}
                      </span>
                    </div>
                    <p className="accMuted">
                      {formatDate(activeOrder.createdAt)} ·{" "}
                      {DELIVERY_LABEL[activeOrder.deliveryMethod] || activeOrder.deliveryMethod}
                    </p>
                    <div className="accActiveOrderFoot">
                      <span>{activeOrder.items.length} поз. · {money(activeOrder.total)}</span>
                      {(activeOrder.status === "PROCESSING" || activeOrder.status === "SHIPPED") && (
                        <Link href={`/account/orders/${activeOrder.id}`} className="darkButton smallBtn">
                          Отследить
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="accEmpty">
                    <p>Нет активных заказов.</p>
                    <Link href="/catalog" className="lightButton smallBtn">
                      Выбрать новое
                    </Link>
                  </div>
                )}
              </section>
            </div>

            {/* Последние заказы */}
            <section className="accCard">
              <div className="accCardHead">
                <h3>Последние заказы</h3>
                {orders.length > 0 && (
                  <Link href="/account/orders" className="accLink">Все заказы →</Link>
                )}
              </div>
              {recent.length === 0 ? (
                <div className="accEmpty">
                  <p className="accMuted">
                    У вас пока нет заказов. Начните с любимых моделей в каталоге.
                  </p>
                  <Link href="/catalog" className="darkButton">Смотреть каталог</Link>
                </div>
              ) : (
                <div className="accRecent">
                  <div className="accRecentHead accRowHead">
                    <span>№</span>
                    <span>Дата</span>
                    <span>Статус</span>
                    <span>Оплата</span>
                    <span className="accRight">Сумма</span>
                  </div>
                  {recent.map(o => (
                    <Link
                      key={o.id}
                      href={`/account/orders/${o.id}`}
                      className="accRecentRow accRowBody"
                    >
                      <span>#{o.id}</span>
                      <span>{formatDate(o.createdAt)}</span>
                      <span className={`obadge obadge-${STATUS_BADGE[o.status] || "new"}`}>
                        {STATUS_LABEL[o.status] || o.status}
                      </span>
                      <span className="accMuted">{PAYMENT_LABEL[o.paymentStatus] || o.paymentStatus}</span>
                      <span className="accRight accStrong">{money(o.total)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        );
      }}
    </AccountShell>
  );
}
