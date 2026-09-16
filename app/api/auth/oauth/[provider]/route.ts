import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { googleAuthUrl, appleAuthUrl } from "@/lib/oauth";

export async function GET(_r: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (provider !== "google" && provider !== "apple") {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  let url: string;
  try {
    const state = randomBytes(24).toString("hex");
    const store = await cookies();
    store.set("nella_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 600,
    });
    url = provider === "google" ? googleAuthUrl(state) : appleAuthUrl(state);
  } catch {
    return NextResponse.redirect((process.env.APP_URL || "http://localhost:3000") + "/account?oauth=error");
  }

  return NextResponse.redirect(url);
}