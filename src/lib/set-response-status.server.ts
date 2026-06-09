import { createIsomorphicFn } from "@tanstack/react-start";

export const setSsrStatus = createIsomorphicFn()
  .client((_code: number) => {})
  .server(async (code: number) => {
    try {
      const { setResponseStatus } = await import("@tanstack/react-start/server");
      setResponseStatus(code);
    } catch {
      // no-op outside SSR request context
    }
  });
