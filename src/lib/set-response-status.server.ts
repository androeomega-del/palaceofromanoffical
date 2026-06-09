import { createServerOnlyFn } from "@tanstack/react-start";

export const setSsrStatus = createServerOnlyFn((code: number) => {
  try {
    // Dynamically require to keep server-only import out of client graph
    const { setResponseStatus } = require("@tanstack/react-start/server") as {
      setResponseStatus: (c: number) => void;
    };
    setResponseStatus(code);
  } catch {
    // no-op outside SSR request context
  }
});
