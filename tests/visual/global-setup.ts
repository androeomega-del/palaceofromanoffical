import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  fetchCollections,
  fetchVendorIndex,
  type ShopifyCollection,
} from "../../src/lib/shopify";
import {
  buildDepartments,
  buildBrandList,
  type MegaDepartment,
} from "../../src/lib/nav-config";

export type VisualFixture = {
  generatedAt: string;
  /** Collection handles that the /collections grid is expected to render. */
  collectionHandles: string[];
  /** One entry per top-level megamenu department. */
  departments: Array<{
    key: string;
    label: string;
    rootHandle: string;
    featureHandle: string;
    itemHandles: string[];
  }>;
  /** Luxury vendor slugs surfaced in the Brands menu. */
  brandVendors: string[];
};

const FIXTURE_PATH = path.resolve(
  process.cwd(),
  "tests/visual/.fixtures.json",
);

function flattenItemHandles(dept: MegaDepartment, liveHandles: Set<string>): string[] {
  const all: string[] = [];
  for (const col of dept.columns) {
    for (const it of col.items) {
      if (liveHandles.has(it.handle)) all.push(it.handle);
    }
  }
  return all;
}

export default async function globalSetup(): Promise<void> {
  const collections: ShopifyCollection[] = await fetchCollections(100);
  const liveHandles = new Set(collections.map((c) => c.handle));
  const departments = buildDepartments(collections);

  let brandVendors: string[] = [];
  try {
    const vendors = await fetchVendorIndex(2, 250);
    brandVendors = buildBrandList(vendors).map((b) => b.vendor);
  } catch {
    // brand index is optional — keep fixture stable even if it errors
    brandVendors = [];
  }

  const fixture: VisualFixture = {
    generatedAt: new Date().toISOString(),
    collectionHandles: collections.map((c) => c.handle),
    departments: departments.map((d) => ({
      key: d.key,
      label: d.label,
      rootHandle: d.rootHandle,
      featureHandle: d.feature.handle,
      itemHandles: flattenItemHandles(d, liveHandles),
    })),
    brandVendors,
  };

  await mkdir(path.dirname(FIXTURE_PATH), { recursive: true });
  await writeFile(FIXTURE_PATH, JSON.stringify(fixture, null, 2));

  // eslint-disable-next-line no-console
  console.log(
    `[visual fixtures] ${fixture.collectionHandles.length} collections, ${fixture.departments.length} departments, ${fixture.brandVendors.length} brands`,
  );
}
