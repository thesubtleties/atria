import { baseApi } from '../api';

type UploadImageParams = {
  file: File;
  context: string;
  eventId?: number;
};

type UploadImageResponse = {
  url: string;
  object_key: string;
  bucket: string;
  context: string;
};

type DeleteUploadParams = {
  objectKey: string;
};

/** Response from presigned URL endpoints */
type PresignedUrlResponse = {
  url: string;
  expires_in: number;
};

export const uploadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadImage: builder.mutation<UploadImageResponse, UploadImageParams>({
      query: ({ file, context, eventId }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('context', context);
        if (eventId) {
          formData.append('event_id', String(eventId));
        }

        return {
          url: '/uploads/image',
          method: 'POST',
          data: formData,
        };
      },
      invalidatesTags: (_result, _error, { context }) => {
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

    getAuthenticatedContent: builder.query<PresignedUrlResponse, string>({
      query: (objectKey) => ({
        url: `/content/${objectKey}`,
      }),
    }),

    getPrivateContent: builder.query<PresignedUrlResponse, string>({
      query: (objectKey) => ({
        url: `/private/${objectKey}`,
      }),
    }),

    deleteUpload: builder.mutation<void, DeleteUploadParams>({
      query: ({ objectKey }) => ({
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
