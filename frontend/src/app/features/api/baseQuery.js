import axiosInstance from '@/lib/axios';

export const axiosBaseQuery = async ({ url, method = 'GET', body, data, params }) => {
  try {
    const result = await axiosInstance({
      url,
      method,
      data: data || body,
      params,
    });
    return { data: result.data };
  } catch (error) {
    return {
      error: {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      },
    };
  }
};
