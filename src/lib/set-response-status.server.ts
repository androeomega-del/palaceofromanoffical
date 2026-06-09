import { createIsomorphicFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";

export const setSsrStatus = createIsomorphicFn()
  .client((_code: number) => {})
  .server((code: number) => {
    try {
      setResponseStatus(code);
    } catch {
      // no-op outside SSR request context
    }
  });
