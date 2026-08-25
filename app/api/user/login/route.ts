import { NextResponse } from "next/server";
import { loginUser } from "@/lib/auth";

export async function POST(r: Request) {
  try {
    const b = await r.json();
    const user = await loginUser({
      email: String(b.email || ""),
      password: String(b.password || ""),
    });
    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка входа" },
      { status: 401 }
    );
  }
}
