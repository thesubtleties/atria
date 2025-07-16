import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Always send cookies
});

// Add interceptors to the base instance
// REQ interceptor (adds to all requests)
axiosClient.interceptors.request.use(
  (config) => {
    console.log('Final URL:', `${config.baseURL}${config.url}`);
    // No need to manually add token - cookies are sent automatically
    // Ensure cookies are included
    config.withCredentials = true;
    
    // If data is FormData, delete the Content-Type header to let browser set it
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
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
        // Just try to refresh - cookies will be sent automatically
        await axiosClient.post('/auth/refresh', {});
        
        // Retry the original request with the new cookies
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Don't redirect here - let the app handle auth state
        // The guards will handle redirects based on auth state
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
