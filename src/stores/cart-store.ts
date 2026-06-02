import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SHOPIFY_STORE_PERMANENT_DOMAIN, storefrontApiRequest, type ShopifyProduct, type Money } from "@/lib/shopify";
import { trackCartEvent } from "@/lib/cart-analytics";
import { scheduleAbandonedCartSync } from "@/lib/abandoned-cart-capture";

export interface CartItem {
  lineId: string | null;
  product: ShopifyProduct;
  variantId: string;
  variantTitle: string;
  price: Money;
  quantity: number;
  selectedOptions: Array<{ name: string; value: string }>;
}

interface CartStore {
  items: CartItem[];
  cartId: string | null;
  checkoutUrl: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  setDrawerOpen: (v: boolean) => void;
  addItem: (item: Omit<CartItem, "lineId">) => Promise<boolean>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  getCheckoutUrl: () => string | null;
}

const CART_QUERY = `
  query cart($id: ID!) {
    cart(id: $id) {
      id
      checkoutUrl
      totalQuantity
      lines(first: 100) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                availableForSale
                price { amount currencyCode }
              }
            }
          }
        }
      }
    }
  }
`;

const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id checkoutUrl
        lines(first: 100) { edges { node { id merchandise { ... on ProductVariant { id } } } } }
      }
      userErrors { field message }
    }
  }
`;

const CART_LINES_ADD_MUTATION = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { id lines(first: 100) { edges { node { id merchandise { ... on ProductVariant { id } } } } } }
      userErrors { field message }
    }
  }
`;

const CART_LINES_UPDATE_MUTATION = `
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { id } userErrors { field message } }
  }
`;

const CART_LINES_REMOVE_MUTATION = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { id } userErrors { field message } }
  }
`;

function formatCheckoutUrl(checkoutUrl: string): string {
  try {
    const url = new URL(checkoutUrl);
    // Route checkout through the connected Shopify checkout subdomain.
    // The apex (palaceofromanofficial.com) points at Lovable and would 404,
    // and the myshopify.com /checkouts/cn URL redirects back to the apex.
    const apexHosts = new Set([
      "palaceofromanofficial.com",
      "www.palaceofromanofficial.com",
      "palaceofroman.com",
      "www.palaceofroman.com",
      SHOPIFY_STORE_PERMANENT_DOMAIN,
    ]);
    if (apexHosts.has(url.host)) {
      url.host = "checkout.palaceofromanofficial.com";
    }
    url.protocol = "https:";
    url.searchParams.set("_fd", "0");
    url.searchParams.set("channel", "online_store");
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}


function isCartNotFoundError(errs: Array<{ field: string[] | null; message: string }>) {
  return errs.some((e) => {
    const m = e.message.toLowerCase();
    return m.includes("cart not found") || m.includes("does not exist");
  });
}

async function createShopifyCart(item: CartItem) {
  const data = await storefrontApiRequest<any>(CART_CREATE_MUTATION, {
    input: { lines: [{ quantity: item.quantity, merchandiseId: item.variantId }] },
  });
  const errs = data?.data?.cartCreate?.userErrors || [];
  if (errs.length) { console.error("Cart creation failed:", errs); return null; }
  const cart = data?.data?.cartCreate?.cart;
  if (!cart?.checkoutUrl) return null;
  const lineId = cart.lines.edges[0]?.node?.id;
  if (!lineId) return null;
  return { cartId: cart.id, checkoutUrl: formatCheckoutUrl(cart.checkoutUrl), lineId };
}

async function addLineToShopifyCart(cartId: string, item: CartItem) {
  const data = await storefrontApiRequest<any>(CART_LINES_ADD_MUTATION, {
    cartId, lines: [{ quantity: item.quantity, merchandiseId: item.variantId }],
  });
  const errs = data?.data?.cartLinesAdd?.userErrors || [];
  if (isCartNotFoundError(errs)) return { success: false, cartNotFound: true };
  if (errs.length) { console.error("Add line failed:", errs); return { success: false }; }
  const lines = data?.data?.cartLinesAdd?.cart?.lines?.edges || [];
  const newLine = lines.find((l: any) => l.node.merchandise.id === item.variantId);
  return { success: true, lineId: newLine?.node?.id };
}

async function updateShopifyCartLine(cartId: string, lineId: string, quantity: number) {
  const data = await storefrontApiRequest<any>(CART_LINES_UPDATE_MUTATION, { cartId, lines: [{ id: lineId, quantity }] });
  const errs = data?.data?.cartLinesUpdate?.userErrors || [];
  if (isCartNotFoundError(errs)) return { success: false, cartNotFound: true };
  if (errs.length) { console.error("Update line failed:", errs); return { success: false }; }
  return { success: true };
}

async function removeLineFromShopifyCart(cartId: string, lineId: string) {
  const data = await storefrontApiRequest<any>(CART_LINES_REMOVE_MUTATION, { cartId, lineIds: [lineId] });
  const errs = data?.data?.cartLinesRemove?.userErrors || [];
  if (isCartNotFoundError(errs)) return { success: false, cartNotFound: true };
  if (errs.length) { console.error("Remove line failed:", errs); return { success: false }; }
  return { success: true };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartId: null,
      checkoutUrl: null,
      isLoading: false,
      isSyncing: false,
      isDrawerOpen: false,
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      setDrawerOpen: (v) => set({ isDrawerOpen: v }),


      addItem: async (item) => {
        const { items, cartId, clearCart } = get();
        const existing = items.find((i) => i.variantId === item.variantId);
        const trackAdd = () =>
          trackCartEvent({
            event_type: "add_to_cart",
            product_handle: item.product?.node?.handle ?? null,
            product_title: item.product?.node?.title ?? null,
            variant_id: item.variantId,
            variant_title: item.variantTitle,
            price_usd: item.price ? Number(item.price.amount) : null,
            quantity: item.quantity,
          });
        set({ isLoading: true });
        try {
          if (!cartId) {
            const result = await createShopifyCart({ ...item, lineId: null });
            if (result) {
              set({
                cartId: result.cartId,
                checkoutUrl: result.checkoutUrl,
                items: [{ ...item, lineId: result.lineId }],
              });
              trackAdd();
              return true;
            }
            return false;
          } else if (existing) {
            const newQty = existing.quantity + item.quantity;
            if (!existing.lineId) return false;
            const r = await updateShopifyCartLine(cartId, existing.lineId, newQty);
            if (r.success) {
              const cur = get().items;
              set({ items: cur.map((i) => (i.variantId === item.variantId ? { ...i, quantity: newQty } : i)) });
              trackAdd();
              return true;
            } else if (r.cartNotFound) {
              clearCart();
              const result = await createShopifyCart({ ...item, lineId: null, quantity: newQty });
              if (result) {
                set({ cartId: result.cartId, checkoutUrl: result.checkoutUrl, items: [{ ...item, quantity: newQty, lineId: result.lineId }] });
                trackAdd();
                return true;
              }
            }
            return false;
          } else {
            const r = await addLineToShopifyCart(cartId, { ...item, lineId: null });
            if (r.success) {
              const cur = get().items;
              if (!r.lineId) return false;
              set({ items: [...cur, { ...item, lineId: r.lineId }] });
              trackAdd();
              return true;
            } else if (r.cartNotFound) {
              clearCart();
              const result = await createShopifyCart({ ...item, lineId: null });
              if (result) {
                set({ cartId: result.cartId, checkoutUrl: result.checkoutUrl, items: [{ ...item, lineId: result.lineId }] });
                trackAdd();
                return true;
              }
            }
            return false;
          }
        } catch (e) {
          console.error("addItem failed", e);
          return false;
        } finally {
          set({ isLoading: false });
          // Revalidate price/availability/quantity against Shopify (background).
          void get().syncCart();
        }
      },

      updateQuantity: async (variantId, quantity) => {
        if (quantity <= 0) return get().removeItem(variantId);
        const { items, cartId, clearCart } = get();
        const item = items.find((i) => i.variantId === variantId);
        if (!item?.lineId || !cartId) return;
        set({ isLoading: true });
        try {
          const r = await updateShopifyCartLine(cartId, item.lineId, quantity);
          if (r.success) {
            const cur = get().items;
            set({ items: cur.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)) });
          } else if (r.cartNotFound) clearCart();
        } finally {
          set({ isLoading: false });
          void get().syncCart();
        }
      },

      removeItem: async (variantId) => {
        const { items, cartId, clearCart } = get();
        const item = items.find((i) => i.variantId === variantId);
        if (!item?.lineId || !cartId) return;
        set({ isLoading: true });
        try {
          const r = await removeLineFromShopifyCart(cartId, item.lineId);
          if (r.success) {
            trackCartEvent({
              event_type: "remove_from_cart",
              product_handle: item.product?.node?.handle ?? null,
              product_title: item.product?.node?.title ?? null,
              variant_id: item.variantId,
              variant_title: item.variantTitle,
              price_usd: item.price ? Number(item.price.amount) : null,
              quantity: item.quantity,
            });
            const cur = get().items;
            const next = cur.filter((i) => i.variantId !== variantId);
            next.length === 0 ? clearCart() : set({ items: next });
          } else if (r.cartNotFound) clearCart();
        } finally {
          set({ isLoading: false });
          void get().syncCart();
        }
      },

      clearCart: () => set({ items: [], cartId: null, checkoutUrl: null }),
      getCheckoutUrl: () => {
        const u = get().checkoutUrl;
        return u ? formatCheckoutUrl(u) : null;
      },

      syncCart: async () => {
        const { cartId, isSyncing, clearCart } = get();
        if (!cartId || isSyncing) return;
        set({ isSyncing: true });
        try {
          const data = await storefrontApiRequest<any>(CART_QUERY, { id: cartId });
          if (!data) return;
          const cart = data?.data?.cart;
          if (!cart || cart.totalQuantity === 0) {
            clearCart();
            return;
          }
          // Build lookup of authoritative line state from Shopify.
          const edges: Array<{ node: any }> = cart.lines?.edges ?? [];
          const byLineId = new Map<string, { quantity: number; available: boolean; price: Money | null }>();
          for (const { node } of edges) {
            const m = node?.merchandise;
            byLineId.set(node.id, {
              quantity: Number(node.quantity ?? 0),
              available: Boolean(m?.availableForSale),
              price: m?.price ? { amount: String(m.price.amount), currencyCode: m.price.currencyCode } : null,
            });
          }
          // Reconcile local items against Shopify: drop unavailable/missing,
          // refresh price + quantity to the server's source of truth.
          const cur = get().items;
          const next: CartItem[] = [];
          for (const item of cur) {
            if (!item.lineId) { next.push(item); continue; }
            const live = byLineId.get(item.lineId);
            if (!live) continue; // line removed server-side
            if (!live.available || live.quantity <= 0) continue; // sold out / zeroed
            next.push({
              ...item,
              quantity: live.quantity,
              price: live.price ?? item.price,
            });
          }
          // Only write if something actually changed to avoid render churn.
          const changed =
            next.length !== cur.length ||
            next.some((n, i) => {
              const o = cur[i];
              return (
                !o ||
                o.lineId !== n.lineId ||
                o.quantity !== n.quantity ||
                o.price.amount !== n.price.amount ||
                o.price.currencyCode !== n.price.currencyCode
              );
            });
          if (changed) {
            if (next.length === 0) clearCart();
            else set({ items: next, checkoutUrl: cart.checkoutUrl ? formatCheckoutUrl(cart.checkoutUrl) : get().checkoutUrl });
          } else if (cart.checkoutUrl) {
            const refreshedCheckoutUrl = formatCheckoutUrl(cart.checkoutUrl);
            if (refreshedCheckoutUrl !== get().checkoutUrl) set({ checkoutUrl: refreshedCheckoutUrl });
          }
        } catch (e) {
          console.error("syncCart failed", e);
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: "palace-of-roman-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, cartId: s.cartId, checkoutUrl: s.checkoutUrl }),
    }
  )
);

// Whenever the cart items change in the browser, debounce-sync the snapshot
// to the abandoned_carts table so the recovery dispatcher can pick it up.
if (typeof window !== "undefined") {
  useCartStore.subscribe((state, prev) => {
    if (state.items !== prev.items) scheduleAbandonedCartSync();
  });
}
