import { createServerFn } from "@tanstack/react-start";
import { fetchHomepageAndCheck } from "./seo-health";

export const checkHomepageSeo = createServerFn({ method: "GET" }).handler(async () => {
  return fetchHomepageAndCheck();
});
