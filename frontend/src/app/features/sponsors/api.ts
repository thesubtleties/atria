import { baseApi } from '../api';
import type { Sponsor, SponsorTier } from '@/types';

type GetSponsorsParams = {
  eventId: number;
  activeOnly?: boolean;
};

type GetSponsorsResponse = {
  sponsors: Sponsor[];
};

type GetSponsorParams = {
  sponsorId: number;
};

type GetFeaturedSponsorsParams = {
  eventId: number;
};

type CreateSponsorParams = {
  eventId: number;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  website_url?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  tier_id?: string | null;
  custom_benefits?: Record<string, unknown> | null;
  display_order?: number | null;
  is_active?: boolean;
  featured?: boolean;
  social_links?: Record<string, string | null> | null;
};

type UpdateSponsorParams = {
  sponsorId: number;
  name?: string;
  description?: string | null;
  logo_url?: string | null;
  website_url?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  tier_id?: string | null;
  custom_benefits?: Record<string, unknown> | null;
  display_order?: number | null;
  is_active?: boolean | null;
  featured?: boolean | null;
  social_links?: Record<string, string | null> | null;
};

type ToggleSponsorParams = {
  sponsorId: number;
};

type GetSponsorTiersParams = {
  eventId: number;
};

// API returns tier data without id (id is the record key)
type SponsorTierData = Omit<SponsorTier, 'id'>;

type GetSponsorTiersResponse = {
  tiers: Record<string, SponsorTierData>;
};

type UpdateSponsorTiersParams = {
  eventId: number;
  tiers: Record<string, SponsorTierData>;
};

export const sponsorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSponsors: builder.query<GetSponsorsResponse, GetSponsorsParams>({
      query: ({ eventId, activeOnly = true }) => ({
        url: `/events/${eventId}/sponsors`,
        params: { active_only: activeOnly ? 1 : 0 },
      }),
      providesTags: (result) =>
        result?.sponsors ?
          [
            ...result.sponsors.map((sponsor) => ({ type: 'Sponsor' as const, id: sponsor.id })),
            { type: 'Sponsor' as const, id: 'LIST' },
          ]
        : [{ type: 'Sponsor' as const, id: 'LIST' }],
    }),

    getSponsor: builder.query<Sponsor, GetSponsorParams>({
      query: ({ sponsorId }) => ({
        url: `/sponsors/${sponsorId}`,
      }),
      providesTags: (_result, _, { sponsorId }) => [{ type: 'Sponsor' as const, id: sponsorId }],
    }),

    getFeaturedSponsors: builder.query<Sponsor[], GetFeaturedSponsorsParams>({
      query: ({ eventId }) => ({
        url: `/events/${eventId}/sponsors/featured`,
      }),
      providesTags: ['Sponsor'],
    }),

    createSponsor: builder.mutation<Sponsor, CreateSponsorParams>({
      query: ({ eventId, ...data }) => ({
        url: `/events/${eventId}/sponsors`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Sponsor' as const, id: 'LIST' }, 'Events'],
    }),

    updateSponsor: builder.mutation<Sponsor, UpdateSponsorParams>({
      query: ({ sponsorId, ...data }) => ({
        url: `/sponsors/${sponsorId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _, { sponsorId }) => [
        { type: 'Sponsor' as const, id: sponsorId },
        { type: 'Sponsor' as const, id: 'LIST' },
        'Events',
      ],
    }),

    toggleSponsorActive: builder.mutation<Sponsor, ToggleSponsorParams>({
      query: ({ sponsorId }) => ({
        url: `/sponsors/${sponsorId}/toggle-active`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { sponsorId }) => [
        { type: 'Sponsor' as const, id: sponsorId },
        { type: 'Sponsor' as const, id: 'LIST' },
        'Events',
      ],
    }),

    toggleSponsorFeatured: builder.mutation<Sponsor, ToggleSponsorParams>({
      query: ({ sponsorId }) => ({
        url: `/sponsors/${sponsorId}/toggle-featured`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _, { sponsorId }) => [
        { type: 'Sponsor' as const, id: sponsorId },
        { type: 'Sponsor' as const, id: 'LIST' },
        'Events',
      ],
    }),

    deleteSponsor: builder.mutation<void, ToggleSponsorParams>({
      query: ({ sponsorId }) => ({
        url: `/sponsors/${sponsorId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _, { sponsorId }) => [
        { type: 'Sponsor' as const, id: sponsorId },
        { type: 'Sponsor' as const, id: 'LIST' },
        'Events',
      ],
    }),

    getSponsorTiers: builder.query<GetSponsorTiersResponse, GetSponsorTiersParams>({
      query: ({ eventId }) => ({
        url: `/events/${eventId}/sponsor-tiers`,
      }),
      providesTags: ['SponsorTiers'],
    }),

    updateSponsorTiers: builder.mutation<void, UpdateSponsorTiersParams>({
      query: ({ eventId, tiers }) => ({
        url: `/events/${eventId}/sponsor-tiers`,
        method: 'PUT',
        body: tiers,
      }),
      invalidatesTags: ['SponsorTiers', { type: 'Sponsor' as const, id: 'LIST' }],
    }),
  }),
});

export const {
  useGetSponsorsQuery,
  useGetSponsorQuery,
  useGetFeaturedSponsorsQuery,
  useCreateSponsorMutation,
  useUpdateSponsorMutation,
  useToggleSponsorActiveMutation,
  useToggleSponsorFeaturedMutation,
  useDeleteSponsorMutation,
  useGetSponsorTiersQuery,
  useUpdateSponsorTiersMutation,
} = sponsorsApi;
