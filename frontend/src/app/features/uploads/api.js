import { baseApi } from '../api';

export const uploadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadImage: builder.mutation({
      query: ({ file, context, eventId }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('context', context);
        if (eventId) {
          formData.append('event_id', eventId);
        }

        return {
          url: '/uploads/image',
          method: 'POST',
          data: formData,
          // Let axios set the Content-Type with boundary automatically
        };
      },
      invalidatesTags: (result, error, { context }) => {
        // Invalidate relevant tags based on context
        switch (context) {
          case 'avatar':
            return ['Users'];
          case 'event_logo':
          case 'event_banner':
            return ['Events'];
          case 'sponsor_logo':
            return ['Sponsor'];
          default:
            return [];
        }
      },
    }),
    
    getAuthenticatedContent: builder.query({
      query: (objectKey) => `/content/${objectKey}`,
    }),
    
    getPrivateContent: builder.query({
      query: (objectKey) => `/private/${objectKey}`,
    }),
    
    deleteUpload: builder.mutation({
      query: (objectKey) => ({
        url: `/uploads/${objectKey}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users', 'Events', 'Sponsor'],
    }),
  }),
});

export const {
  useUploadImageMutation,
  useGetAuthenticatedContentQuery,
  useGetPrivateContentQuery,
  useDeleteUploadMutation,
} = uploadsApi;