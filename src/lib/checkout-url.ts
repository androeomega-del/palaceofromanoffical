const BRANDED_CHECKOUT_HOST = "checkout.palaceofromanofficial.com";

const LEGACY_CHECKOUT_HOSTS = new Set([
  "mwuwqi-vy.myshopify.com",
  "palaceofroman.com",
  "palaceofromanofficial.com",
  "www.palaceofromanofficial.com",
]);

export interface CheckoutUrlInspection {
  ok: boolean;
  inputHost: string | null;
  outputHost: string | null;
  outputPath: string | null;
  hasOnlineStoreChannel: boolean;
  isExpectedCheckoutHost: boolean;
}

// CHECKOUT LOCKDOWN: this is the only approved host rewrite for Shopify
// checkout URLs. Do not change cart mutations, checkout URL generation,
// persisted cart shape, or checkout opening behavior unless checkout is being
// intentionally tested end-to-end immediately after the change.
export function formatCheckoutUrl(checkoutUrl: string): string {
  try {
    const url = new URL(checkoutUrl);
    if (LEGACY_CHECKOUT_HOSTS.has(url.host)) {
      url.host = BRANDED_CHECKOUT_HOST;
    }
    url.protocol = "https:";
    url.searchParams.set("channel", "online_store");
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}

export function inspectCheckoutUrl(checkoutUrl: string): CheckoutUrlInspection {
  try {
    const input = new URL(checkoutUrl);
    const output = new URL(formatCheckoutUrl(checkoutUrl));
    const isExpectedCheckoutHost = output.host === BRANDED_CHECKOUT_HOST;
    const hasOnlineStoreChannel = output.searchParams.get("channel") === "online_store";

    return {
      ok: isExpectedCheckoutHost && hasOnlineStoreChannel,
      inputHost: input.host,
      outputHost: output.host,
      outputPath: output.pathname,
      hasOnlineStoreChannel,
      isExpectedCheckoutHost,
    };
  } catch {
    return {
      ok: false,
      inputHost: null,
      outputHost: null,
      outputPath: null,
      hasOnlineStoreChannel: false,
      isExpectedCheckoutHost: false,
    };
  }
}

export const EXPECTED_CHECKOUT_HOST = BRANDED_CHECKOUT_HOST;