"use client";
import { useEffect, useState } from "react";
import AccountShell from "@/components/AccountShell";

type Address = {
  id: number;
  label: string;
  fullText: string;
  isDefault: boolean;
  createdAt: string;
};

export default function AccountAddressesPage() {
  return (
    <AccountShell pageTitle="Адресная книга">
      {() => <AddressBook />}
    </AccountShell>
  );
}

function AddressBook() {
  const [addrs, setAddrs] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [house, setHouse] = useState("");
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/account/addresses");
      const d = await r.json();
      if (r.ok) setAddrs(d.addresses || []);
    } catch {
      setMsg({ type: "err", text: "Не удалось загрузить адреса" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const flash = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const regionT = region.trim();
    const cityT = city.trim();
    const streetT = street.trim();
    const houseT = house.trim();
    if (!cityT || !streetT || !houseT) {
      setErr("Укажите город, улицу и дом");
      return;
    }
    const fullText = [regionT, cityT ? `г. ${cityT}` : "", streetT ? `ул. ${streetT}` : "", houseT ? `д. ${houseT}` : ""].filter(Boolean).join(", ");
    setBusy(true);
    try {
      const r = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() || "Дом", fullText }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Ошибка");
      setLabel("");
      setRegion("");
      setCity("");
      setStreet("");
      setHouse("");
      setFormOpen(false);
      await load();
      flash("ok", "Адрес добавлен");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function setDefault(id: number) {
    await fetch(`/api/account/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    await load();
  }

  async function remove(id: number) {
    if (!window.confirm("Удалить этот адрес?")) return;
    await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    await load();
    flash("ok", "Адрес удалён");
  }

  return (
    <div className="accAddrWrap">
      {msg && <p className={`accPwdMsg ${msg.type}`}>{msg.text}</p>}

      <div className="accCardHead accAddrHead">
        <h3>Сохранённые адреса</h3>
        <button className="lightButton" onClick={() => setFormOpen(o => !o)}>
          {formOpen ? "Отмена" : "＋ Добавить адрес"}
        </button>
      </div>

      {formOpen && (
        <form className="accAddrForm" onSubmit={add}>
          <div className="accAddrRow">
            <div className="accField accAddrLabelField">
              <label htmlFor="ad-label">Название</label>
              <input
                id="ad-label"
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="Дом / Работа"
                maxLength={30}
              />
            </div>
            <div className="accField">
              <label htmlFor="ad-region">Край / область</label>
              <input
                id="ad-region"
                type="text"
                value={region}
                onChange={e => setRegion(e.target.value)}
                placeholder="Ставропольский край"
                maxLength={60}
              />
            </div>
          </div>
          <div className="accAddrRow">
            <div className="accField">
              <label htmlFor="ad-city">Город *</label>
              <input
                id="ad-city"
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Георгиевск"
                maxLength={60}
              />
            </div>
            <div className="accField">
              <label htmlFor="ad-street">Улица *</label>
              <input
                id="ad-street"
                type="text"
                value={street}
                onChange={e => setStreet(e.target.value)}
                placeholder="ул. Калинина"
                maxLength={80}
              />
            </div>
            <div className="accField">
              <label htmlFor="ad-house">Дом *</label>
              <input
                id="ad-house"
                type="text"
                value={house}
                onChange={e => setHouse(e.target.value)}
                placeholder="130"
                maxLength={20}
              />
            </div>
          </div>
          {err && <p className="accPwdMsg err">{err}</p>}
          <button type="submit" className="darkButton" disabled={busy} style={{ opacity: busy ? 0.5 : 1 }}>
            {busy ? "Сохранение…" : "Сохранить адрес"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="accMuted">Загрузка…</p>
      ) : addrs.length === 0 ? (
        <div className="accAddrEmpty">
          <p className="accMuted">Адресов пока нет — добавьте первый, чтобы при оформлении заказа адрес подставлялся автоматически.</p>
        </div>
      ) : (
        <div className="accAddrList">
          {addrs.map(a => (
            <div key={a.id} className={`accAddrCard${a.isDefault ? " isDefault" : ""}`}>
              <div className="accAddrMeta">
                <b className="accAddrLabel">{a.label}</b>
                {a.isDefault && <span className="accAddrDefault">Основной</span>}
              </div>
              <p className="accAddrText">{a.fullText}</p>
              <div className="accAddrActions">
                {!a.isDefault && (
                  <button className="lightButton" onClick={() => setDefault(a.id)}>
                    Сделать основным
                  </button>
                )}
                <button className="dangerText" onClick={() => remove(a.id)}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}