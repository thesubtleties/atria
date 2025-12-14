import { baseApi } from '../api';

interface Sponsor {
  id: number;
  name: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  tier?: string;
  tier_order?: number;
  is_active: boolean;
  is_featured: boolean;
  event_id: number;
  created_at: string;
  updated_at: string;
}

interface SponsorTier {
  name: string;
  color: string;
  benefits: string[];
  order: number;
}

interface GetSponsorsParams {
  eventId: number;
  activeOnly?: boolean;
}

interface GetSponsorsResponse {
  sponsors: Sponsor[];
}

interface GetSponsorParams {
  sponsorId: number;
}

interface GetFeaturedSponsorsParams {
  eventId: number;
}

interface CreateSponsorParams {
  eventId: number;
  name: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  tier?: string;
}

interface UpdateSponsorParams {
  sponsorId: number;
  name?: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  tier?: string;
  is_active?: boolean;
  is_featured?: boolean;
}

interface ToggleSponsorParams {
  sponsorId: number;
}

interface GetSponsorTiersParams {
  eventId: number;
}

interface GetSponsorTiersResponse {
  tiers: Record<string, SponsorTier>;
}

interface UpdateSponsorTiersParams {
  eventId: number;
  tiers: Record<string, SponsorTier>;
}

export const sponsorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSponsors: builder.query<GetSponsorsResponse, GetSponsorsParams>({
      query: ({ eventId, activeOnly = true }) => ({
        url: `/events/${eventId}/sponsors`,
        params: { active_only: activeOnly ? 1 : 0 },
      }),
      providesTags: (result) =>
        result?.sponsors
          ? [
              ...result.sponsors.map((sponsor) => ({ type: 'Sponsor' as const, id: sponsor.id })),
              { type: 'Sponsor' as const, id: 'LIST' },
            ]
          : [{ type: 'Sponsor' as const, id: 'LIST' }],
    }),

    getSponsor: builder.query<Sponsor, GetSponsorParams>({
      query: ({ sponsorId }) => ({
        url: `/sponsors/${sponsorId}`,
      }),
      providesTags: (result, _, { sponsorId }) => [{ type: 'Sponsor' as const, id: sponsorId }],
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
      invalidatesTags: [
        { type: 'Sponsor' as const, id: 'LIST' },
        'Events',
      ],
    }),

    updateSponsor: builder.mutation<Sponsor, UpdateSponsorParams>({
      query: ({ sponsorId, ...data }) => ({
        url: `/sponsors/${sponsorId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, _, { sponsorId }) => [
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
      invalidatesTags: [
        { type: 'Sponsor' as const, id: 'LIST' },
        'Events',
      ],
    }),

    toggleSponsorActive: builder.mutation<Sponsor, ToggleSponsorParams>({
      query: ({ sponsorId }) => ({
        url: `/sponsors/${sponsorId}/toggle-active`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { sponsorId }) => [
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
      invalidatesTags: (result, _, { sponsorId }) => [
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
  useDeleteSponsorMutation,
  useToggleSponsorActiveMutation,
  useToggleSponsorFeaturedMutation,
  useGetSponsorTiersQuery,
  useUpdateSponsorTiersMutation,
} = sponsorsApi;