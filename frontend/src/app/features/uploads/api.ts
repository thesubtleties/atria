import { baseApi } from '../api';

interface UploadImageParams {
  file: File;
  context: string;
  eventId?: number;
}

interface UploadImageResponse {
  url: string;
  object_key: string;
}

interface DeleteUploadParams {
  objectKey: string;
}

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
    
    getAuthenticatedContent: builder.query<Blob, string>({
      query: (objectKey) => ({
        url: `/content/${objectKey}`,
        responseHandler: (response: Response) => response.blob(),
      }),
    }),
    
    getPrivateContent: builder.query<Blob, string>({
      query: (objectKey) => ({
        url: `/private/${objectKey}`,
        responseHandler: (response: Response) => response.blob(),
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