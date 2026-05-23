// Browser-safe Storefront API helpers for Shopify Customer Accounts.
// Uses the publishable Storefront token — never the Admin API. All mutations
// return Shopify's `customerUserErrors` verbatim so the UI can render them
// inline (e.g. "Email has already been taken").
//
// Phase 2 — Sprint 2, Safe Path. Completely additive to the existing
// Supabase admin auth at /login + /admin/*; the two surfaces never touch.

import {
  SHOPIFY_STOREFRONT_URL,
  SHOPIFY_STOREFRONT_TOKEN,
} from "@/lib/shopify";

// ── Public types ───────────────────────────────────────────────────────────

export type CustomerUserError = {
  field: string[] | null;
  code: string | null;
  message: string;
};

export type Result<T> =
  | { data: T; errors: [] }
  | { data: null; errors: CustomerUserError[] };

export type AccessToken = { accessToken: string; expiresAt: string };

export type CustomerAddress = {
  firstName: string | null;
  lastName: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  zip: string | null;
  phone: string | null;
};

export type CustomerOrderLine = {
  title: string;
  quantity: number;
  variantTitle: string | null;
  imageUrl: string | null;
};

export type CustomerOrder = {
  id: string;
  orderNumber: number;
  name: string;
  processedAt: string;
  fulfillmentStatus: string | null;
  financialStatus: string | null;
  currentTotalPrice: { amount: string; currencyCode: string };
  statusUrl: string;
  lines: CustomerOrderLine[];
};

export type CustomerProfile = {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  defaultAddress: CustomerAddress | null;
  orders: CustomerOrder[];
};

// ── Internal request helper ────────────────────────────────────────────────

async function storefront<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<{ data?: T; errors?: Array<{ message: string }> }> {
  const res = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`Storefront HTTP ${res.status}`);
  }
  return (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
}

function networkErrorResult<T>(message: string): Result<T> {
  return {
    data: null,
    errors: [{ field: null, code: "NETWORK", message }],
  };
}

function unsupportedScopeResult<T>(): Result<T> {
  return {
    data: null,
    errors: [
      {
        field: null,
        code: "SCOPE_MISSING",
        message:
          "Customer accounts are not yet available — please contact concierge.",
      },
    ],
  };
}

// ── Mutations ──────────────────────────────────────────────────────────────

const CUSTOMER_CREATE = /* GraphQL */ `
  mutation CustomerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer { id email firstName lastName }
      customerUserErrors { field code message }
    }
  }
`;

export async function customerCreate(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  acceptsMarketing?: boolean;
}): Promise<Result<{ id: string; email: string | null }>> {
  try {
    const res = await storefront<{
      customerCreate: {
        customer: { id: string; email: string | null } | null;
        customerUserErrors: CustomerUserError[];
      };
    }>(CUSTOMER_CREATE, { input });
    if (res.errors && res.errors.length > 0) return unsupportedScopeResult();
    const payload = res.data?.customerCreate;
    if (!payload) return networkErrorResult("No response from Shopify.");
    if (payload.customerUserErrors.length > 0) {
      return { data: null, errors: payload.customerUserErrors };
    }
    if (!payload.customer) return networkErrorResult("Could not create account.");
    return { data: payload.customer, errors: [] };
  } catch (err) {
    return networkErrorResult(
      err instanceof Error ? err.message : "Network error.",
    );
  }
}

const ACCESS_TOKEN_CREATE = /* GraphQL */ `
  mutation CustomerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken { accessToken expiresAt }
      customerUserErrors { field code message }
    }
  }
`;

export async function customerAccessTokenCreate(input: {
  email: string;
  password: string;
}): Promise<Result<AccessToken>> {
  try {
    const res = await storefront<{
      customerAccessTokenCreate: {
        customerAccessToken: AccessToken | null;
        customerUserErrors: CustomerUserError[];
      };
    }>(ACCESS_TOKEN_CREATE, { input });
    if (res.errors && res.errors.length > 0) return unsupportedScopeResult();
    const payload = res.data?.customerAccessTokenCreate;
    if (!payload) return networkErrorResult("No response from Shopify.");
    if (payload.customerUserErrors.length > 0) {
      return { data: null, errors: payload.customerUserErrors };
    }
    if (!payload.customerAccessToken)
      return networkErrorResult("Could not sign in.");
    return { data: payload.customerAccessToken, errors: [] };
  } catch (err) {
    return networkErrorResult(
      err instanceof Error ? err.message : "Network error.",
    );
  }
}

const ACCESS_TOKEN_DELETE = /* GraphQL */ `
  mutation CustomerAccessTokenDelete($customerAccessToken: String!) {
    customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
      deletedAccessToken
      userErrors { field message }
    }
  }
`;

export async function customerAccessTokenDelete(
  accessToken: string,
): Promise<void> {
  try {
    await storefront(ACCESS_TOKEN_DELETE, { customerAccessToken: accessToken });
  } catch {
    // Best-effort logout; the client store always clears either way.
  }
}

const CUSTOMER_RECOVER = /* GraphQL */ `
  mutation CustomerRecover($email: String!) {
    customerRecover(email: $email) {
      customerUserErrors { field code message }
    }
  }
`;

export async function customerRecover(
  email: string,
): Promise<Result<{ sent: true }>> {
  try {
    const res = await storefront<{
      customerRecover: { customerUserErrors: CustomerUserError[] };
    }>(CUSTOMER_RECOVER, { email });
    if (res.errors && res.errors.length > 0) return unsupportedScopeResult();
    const payload = res.data?.customerRecover;
    if (!payload) return networkErrorResult("No response from Shopify.");
    if (payload.customerUserErrors.length > 0) {
      return { data: null, errors: payload.customerUserErrors };
    }
    return { data: { sent: true }, errors: [] };
  } catch (err) {
    return networkErrorResult(
      err instanceof Error ? err.message : "Network error.",
    );
  }
}

// ── Query: customer profile + orders ───────────────────────────────────────

const CUSTOMER_QUERY = /* GraphQL */ `
  query Customer($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      firstName
      lastName
      email
      phone
      defaultAddress {
        firstName lastName address1 address2 city province country zip phone
      }
      orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          node {
            id
            orderNumber
            name
            processedAt
            fulfillmentStatus
            financialStatus
            statusUrl
            currentTotalPrice { amount currencyCode }
            lineItems(first: 3) {
              edges {
                node {
                  title
                  quantity
                  variant {
                    title
                    image { url }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

type RawOrder = {
  id: string;
  orderNumber: number;
  name: string;
  processedAt: string;
  fulfillmentStatus: string | null;
  financialStatus: string | null;
  statusUrl: string;
  currentTotalPrice: { amount: string; currencyCode: string };
  lineItems: {
    edges: Array<{
      node: {
        title: string;
        quantity: number;
        variant: { title: string | null; image: { url: string } | null } | null;
      };
    }>;
  };
};

type RawCustomer = {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  defaultAddress: CustomerAddress | null;
  orders: { edges: Array<{ node: RawOrder }> };
};

export async function getCustomer(
  accessToken: string,
): Promise<Result<CustomerProfile>> {
  try {
    const res = await storefront<{ customer: RawCustomer | null }>(
      CUSTOMER_QUERY,
      { customerAccessToken: accessToken },
    );
    if (res.errors && res.errors.length > 0) return unsupportedScopeResult();
    const customer = res.data?.customer;
    if (!customer) {
      return {
        data: null,
        errors: [
          {
            field: null,
            code: "INVALID_TOKEN",
            message: "Your session has expired. Please sign in again.",
          },
        ],
      };
    }
    const orders: CustomerOrder[] = customer.orders.edges.map(({ node }) => ({
      id: node.id,
      orderNumber: node.orderNumber,
      name: node.name,
      processedAt: node.processedAt,
      fulfillmentStatus: node.fulfillmentStatus,
      financialStatus: node.financialStatus,
      currentTotalPrice: node.currentTotalPrice,
      statusUrl: node.statusUrl,
      lines: node.lineItems.edges.map(({ node: line }) => ({
        title: line.title,
        quantity: line.quantity,
        variantTitle: line.variant?.title ?? null,
        imageUrl: line.variant?.image?.url ?? null,
      })),
    }));
    return {
      data: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        defaultAddress: customer.defaultAddress,
        orders,
      },
      errors: [],
    };
  } catch (err) {
    return networkErrorResult(
      err instanceof Error ? err.message : "Network error.",
    );
  }
}
