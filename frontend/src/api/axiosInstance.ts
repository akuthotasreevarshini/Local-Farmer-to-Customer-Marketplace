import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

// ---------------------------------------------------------------------------
// Instance
// ---------------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  headers: { 'Content-Type': 'application/json' },
});

// ---------------------------------------------------------------------------
// Request interceptor — attach the in-memory access token
// ---------------------------------------------------------------------------

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response interceptor — single refresh retry on 401
// ---------------------------------------------------------------------------

/** Flag on request config so we never retry the retry itself */
interface RetryableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;

    const is401 =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry;

    if (!is401) {
      return Promise.reject(error);
    }

    // Mark as retried so we don't loop
    originalRequest._retry = true;

    try {
      // Attempt refresh using the HTTP-only cookie (withCredentials)
      const { data } = await axios.post<{ accessToken: string }>(
        `${import.meta.env.VITE_API_BASE_URL as string}/api/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const newToken = data.accessToken;

      // Persist the new token in the auth store
      useAuthStore.getState().setToken(newToken);

      // Update the Authorization header for the retry
      if (originalRequest.headers) {
        (originalRequest.headers as Record<string, string>)[
          'Authorization'
        ] = `Bearer ${newToken}`;
      } else {
        originalRequest.headers = { Authorization: `Bearer ${newToken}` };
      }

      // Retry the original request with the fresh token
      return axiosInstance(originalRequest);
    } catch {
      // Refresh failed — clear auth state and redirect to login
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }
  },
);

export default axiosInstance;
