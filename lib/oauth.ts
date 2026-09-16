import { sign } from "crypto";

export type OAuthProfile = {
  provider: "google" | "apple";
  providerId: string;
  email: string;
  name?: string;
  emailVerified: boolean;
};

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`OAuth: не задана переменная окружения ${name}`);
  return v;
}

function base64url(data: Buffer | string): string {
  return Buffer.from(data).toString("base64url");
}

function base64urlDecode(s: string): Buffer {
  return Buffer.from(s, "base64url");
}

function decodeJwtPayload<T>(token: string): T {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("OAuth: неверный формат токена");
  return JSON.parse(base64urlDecode(parts[1]).toString("utf8"));
}

function parseDerSignature(der: Buffer): { r: Buffer; s: Buffer } {
  if (der.readUInt8(0) !== 0x30) throw new Error("OAuth: неверная подпись ES256");
  let pos = 1;
  const readLen = (): number => {
    const b = der.readUInt8(pos++);
    if (b < 0x80) return b;
    const n = b & 0x7f;
    let len = 0;
    for (let i = 0; i < n; i++) len = len * 256 + der.readUInt8(pos++);
    return len;
  };
  readLen();
  if (der.readUInt8(pos++) !== 0x02) throw new Error("OAuth: неверная подпись ES256");
  const rLen = readLen();
  let r = der.subarray(pos, pos + rLen);
  pos += rLen;
  if (der.readUInt8(pos++) !== 0x02) throw new Error("OAuth: неверная подпись ES256");
  const sLen = readLen();
  let s = der.subarray(pos, pos + sLen);
  while (r.length > 32) r = r.subarray(1);
  while (s.length > 32) s = s.subarray(1);
  return { r, s };
}

// client_secret для Apple — JWT ES256, подписанный приватным ключом разработчика
export function appleClientSecret(): string {
  const teamId = requiredEnv("APPLE_TEAM_ID");
  const clientId = requiredEnv("APPLE_CLIENT_ID");
  const keyId = requiredEnv("APPLE_KEY_ID");
  const pem = requiredEnv("APPLE_PRIVATE_KEY");

  const header = { alg: "ES256", kid: keyId };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: teamId,
    iat: now,
    exp: now + 3600 * 5,
    aud: "https://appleid.apple.com",
    sub: clientId,
  };

  const head = base64url(JSON.stringify(header));
  const body = base64url(JSON.stringify(payload));
  const input = `${head}.${body}`;

  const der = sign("sha256", Buffer.from(input), pem) as unknown as Buffer;
  const { r, s } = parseDerSignature(der);
  const sig = base64url(Buffer.concat([r, s]));
  return `${input}.${sig}`;
}

export function googleAuthUrl(state: string): string {
  const clientId = requiredEnv("GOOGLE_CLIENT_ID");
  const redirect = `${requiredEnv("APP_URL")}/api/auth/oauth/callback`;
  const p = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirect,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    nonce: Math.random().toString(36).slice(2),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
}

export function appleAuthUrl(state: string): string {
  const clientId = requiredEnv("APPLE_CLIENT_ID");
  const redirect = `${requiredEnv("APP_URL")}/api/auth/oauth/callback`;
  const p = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirect,
    response_type: "code",
    scope: "name email",
    state,
    response_mode: "form_post",
  });
  return `https://appleid.apple.com/auth/authorize?${p.toString()}`;
}

async function postForm(url: string, body: URLSearchParams): Promise<any> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await r.json();
  if (!r.ok) {
    throw new Error(`OAuth: обмен кода не удался (${r.status} ${data?.error || ""})`);
  }
  return data;
}

export async function exchangeGoogleCode(code: string): Promise<OAuthProfile> {
  const clientId = requiredEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requiredEnv("GOOGLE_CLIENT_SECRET");
  const redirect = `${requiredEnv("APP_URL")}/api/auth/oauth/callback`;

  const data = await postForm("https://oauth2.googleapis.com/token", new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirect,
    grant_type: "authorization_code",
  }));

  const claims = decodeJwtPayload<{ sub: string; email: string; email_verified: boolean; name?: string }>(data.id_token);
  if (!claims.sub) throw new Error("OAuth: не получен sub от Google");
  return {
    provider: "google",
    providerId: claims.sub,
    email: (claims.email || "").toLowerCase(),
    name: claims.name,
    emailVerified: !!claims.email_verified,
  };
}

export async function exchangeAppleCode(code: string, firstName?: string, lastName?: string): Promise<OAuthProfile> {
  const clientId = requiredEnv("APPLE_CLIENT_ID");
  const redirect = `${requiredEnv("APP_URL")}/api/auth/oauth/callback`;

  const data = await postForm("https://appleid.apple.com/auth/token", new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: appleClientSecret(),
    redirect_uri: redirect,
    grant_type: "authorization_code",
  }));

  const claims = decodeJwtPayload<{ sub: string; email?: string; email_verified?: string | boolean }>(data.id_token);
  if (!claims.sub) throw new Error("OAuth: не получен sub от Apple");
  const first = firstName || "";
  const last = lastName || "";
  const name = [first, last].filter(Boolean).join(" ") || undefined;
  return {
    provider: "apple",
    providerId: claims.sub,
    email: (claims.email || "").toLowerCase(),
    name,
    emailVerified: claims.email_verified === true || claims.email_verified === "true",
  };
}