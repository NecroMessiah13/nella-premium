import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";

export type AdminAction = "CREATE" | "UPDATE" | "DELETE" | "UPLOAD" | "LOGIN" | "STATUS";

export async function adminLog(
  admin: SessionUser | null,
  action: AdminAction,
  entity: string,
  entityId?: string | number | null,
  details?: string | Record<string, unknown> | null
): Promise<void> {
  if (!admin) return;
  try {
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        action,
        entity,
        entityId: entityId != null ? String(entityId) : null,
        details:
          typeof details === "string"
            ? details
            : details
              ? JSON.stringify(details).slice(0, 2000)
              : null,
      },
    });
  } catch (e) {
    console.error("AdminLog error:", e);
  }
}