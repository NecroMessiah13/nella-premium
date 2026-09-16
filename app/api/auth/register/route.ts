import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";
import { customerLog } from "@/lib/customerLog";

export async function POST(r: Request) {
  try {
    const b = await r.json();
    const user = await registerUser({
      email: String(b.email || ""),
      password: String(b.password || ""),
      name: b.name ? String(b.name) : undefined,
    });
    await customerLog({
      userId: user.id,
      email: user.email,
      action: "REGISTER",
      entity: "user",
      entityId: user.id,
      details: { email: user.email, name: user.name },
    });
    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка регистрации" },
      { status: 400 }
    );
  }
}