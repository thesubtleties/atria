/** Social links for sponsors */
export interface SponsorSocialLinks {
  linkedin: string | null;
  twitter: string | null;
  youtube: string | null;
  tiktok: string | null;
  instagram: string | null;
  facebook: string | null;
  other: string | null;
}

/** Sponsor model */
export interface Sponsor {
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
  tier_info: {
    id: string;
    name: string;
    order: number;
    color: string;
  } | null;
}

/** Detailed sponsor with event info */
export interface SponsorDetail extends Sponsor {
  event: {
    id: number;
    title: string;
    slug: string;
    sponsor_tiers: Array<{
      id: string;
      name: string;
      order: number;
      color: string;
    }>;
  };
}

/** Sponsor creation payload */
export interface SponsorCreateData {
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
}

/** Sponsor update payload */
export interface SponsorUpdateData {
  name?: string;
  description?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  tier_id?: string | null;
  custom_benefits?: Record<string, unknown> | null;
  display_order?: number | null;
  is_active?: boolean | null;
  featured?: boolean | null;
  social_links?: Partial<SponsorSocialLinks> | null;
}
