import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-cache, no-store, must-revalidate",
      },
    });
  }
});

// Cache-busting for the HTML entry: ensure browsers always revalidate the
// document shell so they pick up the latest hashed JS/CSS chunks after a
// redeploy. Hashed assets under /assets/* keep their immutable long cache.
const htmlCacheMiddleware = createMiddleware().server(async ({ next }) => {
  const result = (await next()) as unknown as { response?: Response } & Record<string, unknown>;
  const response = result?.response;
  if (response instanceof Response) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) {
      response.headers.set(
        "cache-control",
        "no-cache, no-store, must-revalidate",
      );
      response.headers.set("pragma", "no-cache");
      response.headers.set("expires", "0");
    }
  }
  return result as never;
});


export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, htmlCacheMiddleware],
  functionMiddleware: [attachSupabaseAuth],
}));
