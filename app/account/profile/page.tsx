"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AccountShell, { Viewer } from "@/components/AccountShell";
import type { OrderView } from "@/lib/orderViews";
import { money } from "@/lib/orderViews";

export default function AccountProfilePage() {
  return (
    <AccountShell pageTitle="Личные данные">
      {({ user, orders }) => <ProfileView user={user} orders={orders} />}
    </AccountShell>
  );
}

function ProfileView({ user, orders }: { user: Viewer; orders: OrderView[] }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdType, setPwdType] = useState<"ok" | "err">("ok");
  const [pwdBusy, setPwdBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setDirty(false);
    }
  }, [user?.name, user?.phone]);

  const spent = orders
    .filter(o => o.paymentStatus === "PAID")
    .reduce((s, o) => s + o.total, 0);
  const memberDate = user?.createdAt ? new Date(user.createdAt) : null;

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError("");
    setBusy(true);
    try {
      const r = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "Не удалось сохранить");
      }
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setPwdMsg("");
    setPwdBusy(true);
    try {
      const r = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwdCurrent, newPassword: pwdNew }),
      });
      const d = await r.json();
      if (!r.ok) {
        setPwdType("err");
        setPwdMsg(d.error || "Не удалось изменить пароль");
        return;
      }
      setPwdCurrent("");
      setPwdNew("");
      setPwdType("ok");
      setPwdMsg("Пароль успешно изменён");
    } catch {
      setPwdType("err");
      setPwdMsg("Ошибка. Попробуйте ещё раз");
    } finally {
      setPwdBusy(false);
    }
  }

  return (
    <div className="accProfile">
      {/* Шапка профиля */}
      <div className="accProfileHead">
        <div className="accProfileAvatar">
          {(user?.name || user?.email || "?")[0].toUpperCase()}
        </div>
        <div className="accProfileInfo">
          <h2>{user?.name || "Клиент"}</h2>
          <p className="accMuted">{user?.email}</p>
          <div className="accProfileBadges">
            {user?.role === "ADMIN" && <span className="accRoleBadge">Администратор</span>}
            {memberDate && (
              <span className="accMemberSince">
                Клиент с{" "}
                {memberDate.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="accProfileGrid">
        {/* Основная колонка — форма */}
        <div className="accProfileCol">
          <section className="accCard">
            <div className="accCardHead">
              <h3>Личные данные</h3>
              {dirty && <span className="accUnsaved">Есть несохранённые изменения</span>}
            </div>
            <form className="accProfileForm" onSubmit={saveProfile}>
              <div className="accField">
                <label htmlFor="pf-name">Имя</label>
                <input
                  id="pf-name"
                  type="text"
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    setDirty(true);
                  }}
                  placeholder="Как к вам обращаться"
                  maxLength={60}
                />
                <small className="accHint">
                  Это имя будет использоваться в заказах и письмах.
                </small>
              </div>

              <div className="accField">
                <label htmlFor="pf-phone">Телефон</label>
                <input
                  id="pf-phone"
                  type="tel"
                  value={phone}
                  onChange={e => {
                    setPhone(e.target.value);
                    setDirty(true);
                  }}
                  placeholder="+7 ___ ___-__-__"
                />
                <small className="accHint">
                  Для уведомлений о доставке и уточнения заказов.
                </small>
              </div>

              {error && <p className="error">{error}</p>}

              <div className="accProfileActions">
                <button
                  type="submit"
                  className="darkButton"
                  disabled={busy || !dirty}
                  style={{
                    opacity: busy || !dirty ? 0.5 : 1,
                    cursor: busy || !dirty ? "not-allowed" : "pointer",
                  }}
                >
                  {busy ? "Сохранение…" : "Сохранить изменения"}
                </button>
                {dirty && (
                  <button
                    type="button"
                    className="lightButton"
                    onClick={() => {
                      setName(user?.name || "");
                      setPhone(user?.phone || "");
                      setDirty(false);
                    }}
                  >
                    Сбросить
                  </button>
                )}
                {saved && <span className="accountSaved">✓ Изменения сохранены</span>}
              </div>
            </form>
          </section>

          {/* Безопасность */}
          <section className="accCard">
            <div className="accCardHead">
              <h3>Безопасность</h3>
            </div>
            <div className="accSecurityRow">
              <div className="accSecurityInfo">
                <b>Смена пароля</b>
                <p className="accMuted">
                  Задайте новый пароль для входа в аккаунт.
                </p>
              </div>
              <button
                className="lightButton"
                onClick={async () => {
                  await fetch("/api/user/logout", { method: "POST" });
                  router.push("/account");
                }}
              >
                Выйти из аккаунта
              </button>
            </div>
            <form className="accPwdForm" onSubmit={changePassword}>
              <div className="accField">
                <label htmlFor="pw-current">Текущий пароль</label>
                <input
                  id="pw-current"
                  type="password"
                  value={pwdCurrent}
                  onChange={e => setPwdCurrent(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              <div className="accField">
                <label htmlFor="pw-new">Новый пароль</label>
                <input
                  id="pw-new"
                  type="password"
                  value={pwdNew}
                  onChange={e => setPwdNew(e.target.value)}
                  placeholder="Не короче 6 символов"
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
              {pwdMsg && <p className={`accPwdMsg ${pwdType}`}>{pwdMsg}</p>}
              <button
                type="submit"
                className="darkButton"
                disabled={pwdBusy || !pwdCurrent || pwdNew.length < 6}
                style={{ opacity: pwdBusy || !pwdCurrent || pwdNew.length < 6 ? 0.5 : 1 }}
              >
                {pwdBusy ? "Сохранение…" : "Сменить пароль"}
              </button>
            </form>
          </section>
        </div>

        {/* Боковая колонка — аккаунт и бонусы */}
        <div className="accProfileCol">
          <section className="accCard">
            <h3>Данные аккаунта</h3>
            <dl className="accDl accProfileDl">
              <dt>Email</dt>
              <dd>{user?.email}</dd>
              <dt>Регистрация</dt>
              <dd>
                {memberDate
                  ? memberDate.toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
              </dd>
              <dt>Всего заказов</dt>
              <dd>{orders.length}</dd>
              <dt>Потрачено</dt>
              <dd className="accStrong">{money(spent)}</dd>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
