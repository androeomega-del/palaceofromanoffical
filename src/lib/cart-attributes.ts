/**
 * Side-channel cart-attribute helper. Writes Shopify cart attributes &
 * notes directly via the Storefront API, reading the active cartId from
 * the cart store WITHOUT modifying its state shape or its mutations.
 *
 * Why a side module: the cart-store contract is locked (see
 * mem://constraints/checkout-protocol). Gift wrap, notes, and similar
 * "metadata on the cart" features live here so we can ship them without
 * touching the protected store.
 *
 * Cart attributes & notes flow to Shopify Checkout: the merchant sees
 * them on the order, and (for gift wrap) the merchant can hand-fulfill
 * the wrap on pack-out. We do NOT charge for gift wrap as a line item.
 */
import { storefrontApiRequest } from "@/lib/shopify";
import { useCartStore } from "@/stores/cart-store";

const CART_NOTE_UPDATE = `
  mutation cartNoteUpdate($cartId: ID!, $note: String!) {
    cartNoteUpdate(cartId: $cartId, note: $note) {
      cart { id }
      userErrors { field message }
    }
  }
`;

const CART_ATTRIBUTES_UPDATE = `
  mutation cartAttributesUpdate($cartId: ID!, $attributes: [AttributeInput!]!) {
    cartAttributesUpdate(cartId: $cartId, attributes: $attributes) {
      cart { id }
      userErrors { field message }
    }
  }
`;

export async function setCartNote(note: string): Promise<boolean> {
  const cartId = useCartStore.getState().cartId;
  if (!cartId) return false;
  const res = await storefrontApiRequest<{
    cartNoteUpdate: { userErrors: Array<{ message: string }> };
  }>(CART_NOTE_UPDATE, { cartId, note });
  const errs = res?.data?.cartNoteUpdate?.userErrors;
  if (errs && errs.length > 0) {
    console.warn("cartNoteUpdate errors", errs);
    return false;
  }
  return true;
}

export async function setCartAttributes(
  attrs: Array<{ key: string; value: string }>,
): Promise<boolean> {
  const cartId = useCartStore.getState().cartId;
  if (!cartId) return false;
  const res = await storefrontApiRequest<{
    cartAttributesUpdate: { userErrors: Array<{ message: string }> };
  }>(CART_ATTRIBUTES_UPDATE, { cartId, attributes: attrs });
  const errs = res?.data?.cartAttributesUpdate?.userErrors;
  if (errs && errs.length > 0) {
    console.warn("cartAttributesUpdate errors", errs);
    return false;
  }
  return true;
}
