/**
 * Vacation Stylist — shared TYPES only.
 * Runtime data lives in Supabase (`public.vacation_destinations`).
 * Server-side queries live in `vacation-destinations.server.ts`.
 * The callable RPC lives in `vacation-destinations.functions.ts`.
 */

export type VacationVibe =
  | "beach-club"
  | "yacht-marina"
  | "resort-evening"
  | "city-escape"
  | "desert-retreat"
  | "alpine-getaway";

export type VacationDestination = {
  slug: string;
  name: string;
  region: string;
  climate: string;
  seasonalNotes: string;
  styleTags: string[];
  editorialSummary: string;
  defaultVibe: VacationVibe;
  updatedAt: string;
};
