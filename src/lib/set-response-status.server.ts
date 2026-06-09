import { setResponseStatus } from "@tanstack/react-start/server";

export function setSsrStatus(code: number) {
  try {
    setResponseStatus(code);
  } catch {
    // no-op outside SSR request context
  }
}
