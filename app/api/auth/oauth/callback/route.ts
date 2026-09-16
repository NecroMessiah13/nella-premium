import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeGoogleCode, exchangeAppleCode } from "@/lib/oauth";
import { oauthLogin } from "@/lib/auth";

const REDIRECT_OK = (process.env.APP_URL || "http://localhost:3000") + "/account";
const REDIRECT_ERR = (process.env.APP_URL || "http://localhost:3000") + "/account?oauth=error";

async function lookupState(state: string | null): Promise<boolean> {
  if (!state) return false;
  const store = await cookies();
  const saved = store.get("nella_oauth_state")?.value;
  store.delete("nella_oauth_state");
  return saved === state;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");
  if (err || !code || !(await lookupState(state))) return NextResponse.redirect(REDIRECT_ERR);
  try {
    const profile = await exchangeGoogleCode(code);
    const user = await oauthLogin(profile);
    return NextResponse.redirect(REDIRECT_OK);
  } catch {
    return NextResponse.redirect(REDIRECT_ERR);
  }
}

export async function POST(req: Request) {
  const form = await req.formData();
  const code = String(form.get("code") || "");
  const state = String(form.get("state") || "");
  const userJson = String(form.get("user") || "");
  const err = String(form.get("error") || "");
  if (err || !code || !(await lookupState(state))) return NextResponse.redirect(REDIRECT_ERR);

  let firstName = "";
  let lastName = "";
  try {
    if (userJson) {
      const u = JSON.parse(userJson);
      firstName = u?.name?.firstName || "";
      lastName = u?.name?.lastName || "";
    }
  } catch {
    // ignore malformed user json
  }

  try {
    const profile = await exchangeAppleCode(code, firstName, lastName);
    const user = await oauthLogin(profile);
    return NextResponse.redirect(REDIRECT_OK);
  } catch {
    return NextResponse.redirect(REDIRECT_ERR);
  }
}