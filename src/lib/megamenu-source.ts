// Converts a normalised Shopify main-menu tree into the MegaDepartment shape
// used by `megamenu.tsx`. Strict by design — if either Women or Men can't
// be derived from the tree, returns `null` so the caller falls back to the
// existing `buildDepartments(liveCollections)` path.
//
// The Shopify-derived departments REPLACE the column structure with whatever
// the merchant curated in Shopify Admin, but always inherit the editorial
// feature tile from the parallel `buildDepartments()` result — feature tiles
// are a code-side concern (eyebrow + title copy) and don't exist in Shopify.

import type { MegaDepartment, MegaColumn, MegaItem } from "@/lib/nav-config";
import type { ShopifyMenuTree, ShopifyMenuItem } from "@/lib/shopify-menu";

const WOMEN_TITLES = new Set(["women", "woman", "womens", "women's", "ladies"]);
const MEN_TITLES = new Set(["men", "man", "mens", "men's"]);

function normalisedTitle(s: string): string {
  return s.trim().toLowerCase();
}

function isWomenItem(item: ShopifyMenuItem): boolean {
  return WOMEN_TITLES.has(normalisedTitle(item.title));
}

function isMenItem(item: ShopifyMenuItem): boolean {
  return MEN_TITLES.has(normalisedTitle(item.title));
}

/** Pull a collection handle out of a normalised menu item. Returns `null`
 *  when the item points at anything other than a collection (we only render
 *  collection links inside the megamenu columns). */
function collectionHandle(item: ShopifyMenuItem): string | null {
  return item.link?.kind === "collection" ? item.link.handle : null;
}

function itemsFromColumn(
  column: ShopifyMenuItem,
  liveHandles: Set<string> | null,
): MegaItem[] {
  const out: MegaItem[] = [];
  for (const child of column.items) {
    const handle = collectionHandle(child);
    if (!handle) continue;
    if (liveHandles && !liveHandles.has(handle)) continue;
    out.push({ handle, label: child.title.trim() });
  }
  return out;
}

function buildColumns(
  dept: ShopifyMenuItem,
  liveHandles: Set<string> | null,
): MegaColumn[] {
  const cols: MegaColumn[] = [];
  for (const col of dept.items) {
    const items = itemsFromColumn(col, liveHandles);
    if (items.length === 0) continue;
    cols.push({ heading: col.title.trim(), items });
  }
  return cols;
}

/**
 * Try to build {women, men} MegaDepartments from a Shopify menu tree.
 *
 * Returns `null` when the tree doesn't contain both a Women and a Men
 * top-level item, or when either dept ends up with zero usable columns —
 * in which case the caller falls back to the existing live-built tree.
 *
 * `liveDepartments` provides the editorial feature tile + rootHandle for
 * each department (those are code-side, never sourced from Shopify).
 */
export function buildDepartmentsFromShopifyMenu(
  tree: ShopifyMenuTree,
  liveDepartments: MegaDepartment[],
  liveHandles: Set<string> | null,
): MegaDepartment[] | null {
  const women = tree.items.find(isWomenItem);
  const men = tree.items.find(isMenItem);
  if (!women || !men) return null;

  const womenFallback = liveDepartments.find((d) => d.key === "women");
  const menFallback = liveDepartments.find((d) => d.key === "men");
  if (!womenFallback || !menFallback) return null;

  const womenColumns = buildColumns(women, liveHandles);
  const menColumns = buildColumns(men, liveHandles);
  if (womenColumns.length === 0 || menColumns.length === 0) return null;

  // Root handle: prefer the dept's own collection link if it's a collection,
  // otherwise inherit the live-built dept's rootHandle so the hero "Shop all"
  // link is always wired to an existing collection.
  const womenRoot = collectionHandle(women) ?? womenFallback.rootHandle;
  const menRoot = collectionHandle(men) ?? menFallback.rootHandle;

  return [
    {
      key: "women",
      label: women.title.trim() || womenFallback.label,
      rootHandle: liveHandles && !liveHandles.has(womenRoot)
        ? womenFallback.rootHandle
        : womenRoot,
      columns: womenColumns,
      feature: womenFallback.feature,
    },
    {
      key: "men",
      label: men.title.trim() || menFallback.label,
      rootHandle: liveHandles && !liveHandles.has(menRoot)
        ? menFallback.rootHandle
        : menRoot,
      columns: menColumns,
      feature: menFallback.feature,
    },
  ];
}
