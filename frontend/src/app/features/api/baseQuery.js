import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export const axiosBaseQuery = async ({ url, method = 'GET', body, params }) => {
  try {
    const result = await api({
      url,
      method,
      data: body,
      params,
    });
    return { data: result.data };
  } catch (error) {
    return { error };
  }
};
