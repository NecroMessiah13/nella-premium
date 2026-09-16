import { NextResponse } from "next/server";
import { ensureAdmin, adminLogin } from "@/lib/auth";
import { adminLog } from "@/lib/adminLog";

export async function POST(r: Request) {
  const b = await r.json();
  await ensureAdmin();
  const u = await adminLogin(String(b.email || "").trim().toLowerCase(), String(b.password || ""));
  if (!u) return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  await adminLog(
    { id: u.id, email: u.email, role: u.role, name: u.name },
    "LOGIN",
    "auth",
    u.id,
    { email: u.email }
  );
  return NextResponse.json({ user: { id: u.id, email: u.email, role: u.role } });
}