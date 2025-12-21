/**
 * Sponsor-related types
 *
 * Convention: Response types use `| null` for nullable API fields.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Sponsor Types
// ─────────────────────────────────────────────────────────────────────────────

/** Social links for sponsors */
export type SponsorSocialLinks = {
  linkedin: string | null;
  twitter: string | null;
  youtube: string | null;
  tiktok: string | null;
  instagram: string | null;
  facebook: string | null;
  other: string | null;
};

/** Sponsor tier info */
export type SponsorTierInfo = {
  id: string;
  name: string;
  order: number;
  color: string;
};

/** Sponsor model */
export type Sponsor = {
  id: number;
  event_id: number;
  name: string;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  tier_id: string | null;
  custom_benefits: Record<string, unknown> | null;
  display_order: number | null;
  is_active: boolean;
  featured: boolean;
  social_links: SponsorSocialLinks | null;
  // Computed from tier_info
  tier_name: string | null;
  tier_order: number;
  tier_color: string;
  tier_info: SponsorTierInfo | null;
};

/** Detailed sponsor with event info */
export type SponsorDetail = Sponsor & {
  event: {
    id: number;
    title: string;
    slug: string;
    sponsor_tiers: SponsorTierInfo[];
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// API Payloads
// ─────────────────────────────────────────────────────────────────────────────

/** Sponsor creation payload - all optional fields can be omitted */
export type SponsorCreateData = {
  name: string;
  description?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  tier_id?: string | null;
  custom_benefits?: Record<string, unknown> | null;
  display_order?: number | null;
  is_active?: boolean;
  featured?: boolean;
  social_links?: Partial<SponsorSocialLinks> | null;
};

/** Sponsor update payload - all fields can be omitted */
export type SponsorUpdateData = Partial<SponsorCreateData>;

// ─────────────────────────────────────────────────────────────────────────────
// Type Guards
// ─────────────────────────────────────────────────────────────────────────────

/** Check if sponsor is active */
export function isActiveSponsor(sponsor: Sponsor): boolean {
  return sponsor.is_active;
}

/** Check if sponsor is featured */
export function isFeaturedSponsor(sponsor: Sponsor): boolean {
  return sponsor.featured;
}

/** Check if sponsor has a tier assigned */
export function hasTier(sponsor: Sponsor): sponsor is Sponsor & { tier_info: SponsorTierInfo } {
  return sponsor.tier_info !== null;
}
