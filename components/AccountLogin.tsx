"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountLogin({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [oauthError, setOauthError] = useState(
    typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("oauth") === "error"
  );
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const url = mode === "login" ? "/api/user/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : { email, password, name: name || undefined };
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Ошибка");
      setPassword("");
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="accLogin">
      <div className="authCard" style={{ maxWidth: 480, margin: "0 auto" }}>
        <span className="eyebrow">NELLA PREMIUM</span>
        <h1>{mode === "login" ? "Вход" : "Регистрация"}</h1>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button
            className={mode === "login" ? "darkButton" : "lightButton"}
            style={{ flex: 1, padding: "10px 15px" }}
            onClick={() => {
              setMode("login");
              setErr("");
            }}
          >
            Вход
          </button>
          <button
            className={mode === "register" ? "darkButton" : "lightButton"}
            style={{ flex: 1, padding: "10px 15px" }}
            onClick={() => {
              setMode("register");
              setErr("");
            }}
          >
            Регистрация
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <a
            href="/api/auth/oauth/google"
            className="lightButton"
            style={{ textAlign: "center", padding: "13px 15px" }}
          >
            Продолжить с Google
          </a>
          <a
            href="/api/auth/oauth/apple"
            className="lightButton"
            style={{ textAlign: "center", padding: "13px 15px" }}
          >
            Продолжить с Apple
          </a>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "0 0 20px",
            color: "var(--muted)",
            fontSize: 12,
          }}
        >
          <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
          или
          <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
        </div>

        <form className="checkoutForm" onSubmit={submit} style={{ marginTop: 0 }}>
          {mode === "register" && (
            <input
              type="text"
              placeholder="Имя"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Пароль (мин. 6 символов)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {err && <p className="error">{err}</p>}
          {oauthError && (
            <p className="error">
              Не удалось войти через внешний сервис. Попробуйте ещё раз.
            </p>
          )}
          <button type="submit" className="darkButton fullButton" disabled={busy}>
            {busy
              ? "Пожалуйста, подождите…"
              : mode === "login"
              ? "Войти"
              : "Создать аккаунт"}
          </button>
        </form>

        <p
          style={{
            fontSize: 12,
            color: "var(--muted)",
            textAlign: "center",
            marginTop: 16,
          }}
        >
          {mode === "login"
            ? "Нет аккаунта? Зарегистрируйтесь для сохранения избранного и истории заказов."
            : "Уже есть аккаунт? Войдите."}
        </p>
      </div>
    </div>
  );
}
