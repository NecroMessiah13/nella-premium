import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";

export async function POST(r: Request) {
  try {
    const b = await r.json();
    const user = await registerUser({
      email: String(b.email || ""),
      password: String(b.password || ""),
      name: b.name ? String(b.name) : undefined,
    });
    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка регистрации" },
      { status: 400 }
    );
  }
}
