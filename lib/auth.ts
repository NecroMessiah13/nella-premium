import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "nella_session";
const GUEST_COOKIE = "nella_guest";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: number;
  email: string;
  role: string;
  name: string | null;
};

function cookieSecure(): boolean {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  return process.env.NODE_ENV === "production";
}

function makeCookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: cookieSecure(),
    path: "/",
    maxAge: maxAgeSec,
  };
}

async function getOrCreateGuestId(): Promise<string> {
  const store = await cookies();
  let id = store.get(GUEST_COOKIE)?.value;
  if (!id) {
    id = randomUUID();
    store.set(GUEST_COOKIE, id, makeCookieOptions(60 * 60 * 24 * 365));
  }
  return id;
}

export async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    await prisma.user.create({
      data: { email, passwordHash, role: "ADMIN" },
    });
  } catch (e: any) {
    if (e?.code !== "P2002") throw e;
  }
}

export async function registerUser(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<SessionUser> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error("Некорректный email");
  }
  if (input.password.length < 6) {
    throw new Error("Пароль должен быть не короче 6 символов");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Пользователь с таким email уже существует");

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: input.name?.trim() || null,
      role: "USER",
    },
  });

  await createSession(user.id);
  await mergeGuestWishlistToUser(user.id);
  return { id: user.id, email: user.email, role: user.role, name: user.name };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<SessionUser> {
  const email = input.email.trim().toLowerCase();
  const u = await prisma.user.findUnique({ where: { email } });
  if (!u || !(await bcrypt.compare(input.password, u.passwordHash))) {
    throw new Error("Неверный email или пароль");
  }
  if (u.role !== "USER" && u.role !== "ADMIN") {
    throw new Error("Учётная запись заблокирована");
  }
  await createSession(u.id);
  await mergeGuestWishlistToUser(u.id);
  return { id: u.id, email: u.email, role: u.role, name: u.name };
}

export async function adminLogin(email: string, password: string) {
  const u = await prisma.user.findUnique({ where: { email } });
  if (!u || u.role !== "ADMIN" || !(await bcrypt.compare(password, u.passwordHash))) return null;
  await createSession(u.id);
  return u;
}

async function createSession(userId: number) {
  const id = randomUUID();
  await prisma.session.create({
    data: { id, userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, id, makeCookieOptions(SESSION_TTL_MS / 1000));
}

async function mergeGuestWishlistToUser(userId: number) {
  const guestId = (await cookies()).get(GUEST_COOKIE)?.value;
  if (!guestId) return;
  const guestItems = await prisma.wishlist.findMany({ where: { guestId } });
  for (const item of guestItems) {
    try {
      await prisma.wishlist.upsert({
        where: { userId_productId: { userId, productId: item.productId } },
        update: {},
        create: { userId, productId: item.productId },
      });
    } catch {
      // ignore unique conflicts
    }
  }
  await prisma.wishlist.deleteMany({ where: { guestId } });
}

export async function requireAdmin() {
  const u = await currentUser();
  if (!u || u.role !== "ADMIN") throw new Error("UNAUTHORIZED");
  return u;
}

// Возвращает админа или null (для корректного 401 вместо 500)
export async function getAdmin(): Promise<SessionUser | null> {
  const u = await currentUser();
  return u && u.role === "ADMIN" ? u : null;
}

export async function requireUser(): Promise<SessionUser> {
  const u = await currentUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

export async function currentUser(): Promise<SessionUser | null> {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const s = await prisma.session.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!s || s.expiresAt < new Date()) return null;
  return {
    id: s.user.id,
    email: s.user.email,
    role: s.user.role,
    name: s.user.name,
  };
}

export async function logout() {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (id) await prisma.session.deleteMany({ where: { id } });
  (await cookies()).delete(SESSION_COOKIE);
}

export { getOrCreateGuestId, GUEST_COOKIE };
