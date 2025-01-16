import axios from 'axios';

const axiosClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptors to the base instance
axiosClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Get refresh token from localStorage
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axiosClient.post(
          '/auth/refresh',
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken}` },
          }
        );
        const { access_token } = response.data;

        localStorage.setItem('access_token', access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const axiosInstance = ({ url, method, params, data, headers }) => {
  return axiosClient({
    url,
    method,
    params,
    data,
    headers,
  });
};

export default axiosInstance;
