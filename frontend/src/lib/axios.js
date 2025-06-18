import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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
// lib/axios.js
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Add check for refresh endpoint to prevent loops
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Create a new axios instance without interceptors to avoid infinite loops
        const refreshAxios = axios.create({
          baseURL: import.meta.env.VITE_API_URL || '/api',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`
          },
        });
        
        const response = await refreshAxios.post('/auth/refresh', {});
        const { access_token } = response.data;

        localStorage.setItem('access_token', access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Clear auth state and redirect
        localStorage.clear();
        window.location.href = '/';
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
