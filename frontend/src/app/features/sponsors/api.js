import { baseApi } from '../api';

export const sponsorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSponsors: builder.query({
      query: ({ eventId, activeOnly = true }) => ({
        url: `/events/${eventId}/sponsors`,
        params: { active_only: activeOnly ? 1 : 0 },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Sponsor', id })),
              { type: 'Sponsor', id: 'LIST' },
            ]
          : [{ type: 'Sponsor', id: 'LIST' }],
    }),

    getSponsor: builder.query({
      query: (sponsorId) => ({
        url: `/sponsors/${sponsorId}`,
      }),
      providesTags: (result, _, sponsorId) => [{ type: 'Sponsor', id: sponsorId }],
    }),

    getFeaturedSponsors: builder.query({
      query: ({ eventId }) => ({
        url: `/events/${eventId}/sponsors/featured`,
      }),
      providesTags: ['Sponsor'],
    }),

    createSponsor: builder.mutation({
      query: ({ eventId, ...data }) => ({
        url: `/events/${eventId}/sponsors`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'Sponsor', id: 'LIST' },
        'Events', // Invalidate event cache so sponsors_count updates
      ],
    }),

    updateSponsor: builder.mutation({
      query: ({ sponsorId, ...data }) => ({
        url: `/sponsors/${sponsorId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, _, { sponsorId }) => [
        { type: 'Sponsor', id: sponsorId },
        { type: 'Sponsor', id: 'LIST' },
        'Events', // Invalidate event cache so sponsors_count updates
      ],
    }),

    deleteSponsor: builder.mutation({
      query: (sponsorId) => ({
        url: `/sponsors/${sponsorId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Sponsor', id: 'LIST' },
        'Events', // Invalidate event cache so sponsors_count updates
      ],
    }),

    toggleSponsorActive: builder.mutation({
      query: (sponsorId) => ({
        url: `/sponsors/${sponsorId}/toggle-active`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, sponsorId) => [
        { type: 'Sponsor', id: sponsorId },
        { type: 'Sponsor', id: 'LIST' },
        'Events', // Invalidate event cache so sponsors_count updates
      ],
    }),

    toggleSponsorFeatured: builder.mutation({
      query: (sponsorId) => ({
        url: `/sponsors/${sponsorId}/toggle-featured`,
        method: 'POST',
      }),
      invalidatesTags: (result, _, sponsorId) => [
        { type: 'Sponsor', id: sponsorId },
        { type: 'Sponsor', id: 'LIST' },
        'Events', // Invalidate event cache for consistency with other sponsor mutations
      ],
    }),


    getSponsorTiers: builder.query({
      query: ({ eventId }) => ({
        url: `/events/${eventId}/sponsor-tiers`,
      }),
      providesTags: ['SponsorTiers'],
    }),

    updateSponsorTiers: builder.mutation({
      query: ({ eventId, tiers }) => ({
        url: `/events/${eventId}/sponsor-tiers`,
        method: 'PUT',
        body: tiers,
      }),
      invalidatesTags: ['SponsorTiers', { type: 'Sponsor', id: 'LIST' }],
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