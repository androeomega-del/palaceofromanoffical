import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/admin-middleware";

/**
 * Server function used by admin route `beforeLoad` guards. If the caller is
 * not an authenticated admin, `requireAdmin` throws and the route fails to
 * load — preventing the page (and its data calls) from ever rendering.
 */
export const ensureAdmin = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => ({ ok: true as const }));
