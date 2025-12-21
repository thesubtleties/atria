import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

const axiosClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Always send cookies
});

// Add interceptors to the base instance
// REQ interceptor (adds to all requests)
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // No need to manually add token - cookies are sent automatically
    // Ensure cookies are included
    config.withCredentials = true;

    // If data is FormData, delete the Content-Type header to let browser set it
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// RES interceptor (adds to all responses)
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Add check for refresh endpoint to prevent loops
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
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
  },
);

/** Request configuration for axiosInstance */
export type AxiosRequestOptions = {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: Record<string, string>;
};

export const axiosInstance = <T = unknown>({
  url,
  method = 'GET',
  params,
  data,
  headers,
}: AxiosRequestOptions): Promise<AxiosResponse<T>> => {
  return axiosClient({
    url,
    method,
    params,
    data,
    ...(headers ? { headers } : {}),
  });
};

export default axiosInstance;
