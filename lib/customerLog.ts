import { prisma } from "@/lib/prisma";
import { getOrCreateGuestId } from "@/lib/auth";

export type CustomerAction =
  | "REGISTER"
  | "LOGIN"
  | "ORDER_CREATE"
  | "WISHLIST_ADD"
  | "WISHLIST_REMOVE"
  | "ADDRESS_CREATE"
  | "ADDRESS_UPDATE"
  | "ADDRESS_DELETE"
  | "PASSWORD_CHANGE"
  | "PRODUCT_VIEW";

export async function customerLog(
  input: {
    userId?: number | null;
    email?: string | null;
    action: CustomerAction;
    entity: string;
    entityId?: string | number | null;
    details?: string | Record<string, unknown> | null;
    withGuest?: boolean;
  }
): Promise<void> {
  try {
    let guestId: string | null = null;
    if (input.withGuest) {
      try {
        guestId = await getOrCreateGuestId();
      } catch {
        guestId = null;
      }
    }
    await prisma.customerLog.create({
      data: {
        userId: input.userId ?? null,
        guestId,
        email: input.email ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId != null ? String(input.entityId) : null,
        details:
          typeof input.details === "string"
            ? input.details
            : input.details
              ? JSON.stringify(input.details).slice(0, 2000)
              : null,
      },
    });
  } catch (e) {
    console.error("CustomerLog error:", e);
  }
}