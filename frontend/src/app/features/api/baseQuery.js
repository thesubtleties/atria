import axiosInstance from '@/lib/axios';

export const axiosBaseQuery = async ({ url, method = 'GET', body, data, params }) => {
  console.log('RTK Query - Full request:', { url, method, body, data, params });
  try {
    const result = await axiosInstance({
      url,
      method,
      data: data || body,
      params,
    });
    console.log('RTK Query - Success response:', result.data);
    return { data: result.data };
  } catch (error) {
    console.log('RTK Query - Error response:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: error.config?.baseURL + error.config?.url,
    });
    return {
      error: {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      },
    };
  }
};
