import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  createMemoryHistory,
  Outlet,
} from "@tanstack/react-router";

import { Route as CollectionsRoute, sortCollections } from "@/routes/collections.index";
import type { ShopifyCollection } from "@/lib/shopify";

// Mock the network layer so the component's useQuery resolves synchronously with our fixture.
vi.mock("@/lib/shopify", async (orig) => {
  const actual = await orig<typeof import("@/lib/shopify")>();
  return {
    ...actual,
    fetchCollections: vi.fn(async () => fixture),
  };
});

const fixture: ShopifyCollection[] = [
  { id: "1", title: "Zenith Capsule", handle: "zenith", description: "", image: null, updatedAt: "2024-01-01T00:00:00Z" },
  { id: "2", title: "Atelier Edit",   handle: "atelier", description: "", image: null, updatedAt: "2026-05-01T00:00:00Z" },
  { id: "3", title: "Maison Noir",    handle: "maison",  description: "", image: null, updatedAt: "2025-03-01T00:00:00Z" },
];

function renderAt(initialUrl: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const child = createRoute({
    getParentRoute: () => rootRoute,
    path: "/collections/",
    validateSearch: CollectionsRoute.options.validateSearch,
    component: CollectionsRoute.options.component!,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([child]),
    history: createMemoryHistory({ initialEntries: [initialUrl] }),
    defaultPreloadStaleTime: 0,
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    router,
    ...render(
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  };
}

describe("sortCollections", () => {
  it("orders alphabetically", () => {
    expect(sortCollections(fixture, "alpha").map((c) => c.title)).toEqual([
      "Atelier Edit", "Maison Noir", "Zenith Capsule",
    ]);
  });
  it("orders newest first by updatedAt", () => {
    expect(sortCollections(fixture, "newest").map((c) => c.title)).toEqual([
      "Atelier Edit", "Maison Noir", "Zenith Capsule",
    ]);
  });
  it("preserves storefront order for popular", () => {
    expect(sortCollections(fixture, "popular").map((c) => c.title)).toEqual([
      "Zenith Capsule", "Atelier Edit", "Maison Noir",
    ]);
  });
});

describe("/collections sort dropdown", () => {
  beforeEach(() => vi.clearAllMocks());

  it("changing the dropdown updates ?sort= and reorders the grid", async () => {
    const user = userEvent.setup();
    const { router } = renderAt("/collections?filter=all&sort=popular");

    // Wait for the grid to render all 3 collections
    await vi.waitFor(() => {
      expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(3);
    });

    // Initial order = storefront order (popular)
    const titlesBefore = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(titlesBefore).toEqual(["Zenith Capsule", "Atelier Edit", "Maison Noir"]);

    // Change sort to A–Z
    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "alpha");

    // URL updated
    expect(router.state.location.search).toMatchObject({ sort: "alpha", filter: "all" });

    // Grid reordered
    const titlesAfter = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(titlesAfter).toEqual(["Atelier Edit", "Maison Noir", "Zenith Capsule"]);

    // Dropdown reflects URL
    expect((select as HTMLSelectElement).value).toBe("alpha");

    // Sanity: select is inside the document
    expect(within(document.body).getAllByRole("heading", { level: 2 })).toHaveLength(3);
  });
});
