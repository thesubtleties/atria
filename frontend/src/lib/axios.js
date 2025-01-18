import axios from 'axios';

const axiosClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptors to the base instance
// REQ interceptor (adds to all requests)
axiosClient.interceptors.request.use(
  (config) => {
    console.log('Final URL:', `${config.baseURL}${config.url}`);
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RES interceptor (adds to all responses)
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // No refresh token, don't attempt refresh
          throw new Error('No refresh token available');
        }

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
        window.location.href = '/'; // Change to root path
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
