/**
 * Server-only Supabase queries for vacation destinations.
 *
 * Reads from `public.vacation_destinations` using the service-role client.
 * A short in-memory TTL cache keeps response times comparable to the
 * previous static-module implementation. The cache is per-Worker-instance,
 * which is acceptable for content that changes via the admin tooling.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { VacationDestination, VacationVibe } from "./vacation-destinations";

const CACHE_TTL_MS = 60_000;

type CacheEntry<T> = { value: T; expiresAt: number };

let listCache: CacheEntry<VacationDestination[]> | null = null;
const slugCache = new Map<string, CacheEntry<VacationDestination | null>>();

type Row = {
  slug: string;
  name: string;
  region: string | null;
  climate: string;
  seasonal_notes: string | null;
  editorial_summary: string;
  style_tags: string[] | null;
  default_vibe: string;
  updated_at: string;
};

function mapRow(row: Row): VacationDestination {
  return {
    slug: row.slug,
    name: row.name,
    region: row.region ?? "",
    climate: row.climate,
    seasonalNotes: row.seasonal_notes ?? "",
    editorialSummary: row.editorial_summary,
    styleTags: row.style_tags ?? [],
    defaultVibe: (row.default_vibe as VacationVibe) ?? "resort-evening",
    updatedAt: row.updated_at,
  };
}

export async function fetchActiveDestinations(): Promise<VacationDestination[]> {
  const now = Date.now();
  if (listCache && listCache.expiresAt > now) return listCache.value;

  const { data, error } = await supabaseAdmin
    .from("vacation_destinations")
    .select(
      "slug,name,region,climate,seasonal_notes,editorial_summary,style_tags,default_vibe,updated_at",
    )
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw new Error(`Failed to load vacation destinations: ${error.message}`);

  const mapped = (data as Row[]).map(mapRow);
  listCache = { value: mapped, expiresAt: now + CACHE_TTL_MS };
  // Warm the per-slug cache as a side effect.
  for (const d of mapped) {
    slugCache.set(d.slug, { value: d, expiresAt: now + CACHE_TTL_MS });
  }
  return mapped;
}

export async function fetchDestinationBySlug(
  slug: string,
): Promise<VacationDestination | null> {
  const now = Date.now();
  const cached = slugCache.get(slug);
  if (cached && cached.expiresAt > now) return cached.value;

  const { data, error } = await supabaseAdmin
    .from("vacation_destinations")
    .select(
      "slug,name,region,climate,seasonal_notes,editorial_summary,style_tags,default_vibe,updated_at",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(`Failed to load destination ${slug}: ${error.message}`);

  const value = data ? mapRow(data as Row) : null;
  slugCache.set(slug, { value, expiresAt: now + CACHE_TTL_MS });
  return value;
}
