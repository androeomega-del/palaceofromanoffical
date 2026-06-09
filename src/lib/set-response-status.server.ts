import { createIsomorphicFn } from "@tanstack/react-start";

export const setSsrStatus = createIsomorphicFn()
  .client((_code: number) => {})
  .server((code: number) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require("@tanstack/react-start/server") as {
        setResponseStatus: (c: number) => void;
      };
      mod.setResponseStatus(code);
    } catch {
      // no-op outside SSR request context
    }
  });
