/**
 * FinEra - API Client with Auth & Error Handling
 */

import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { API_CONFIG, ENDPOINTS } from "./api.config";

class ApiClient {
  private static instance: ApiClient;
  private accessToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  private constructor() {
    this.setupInterceptors();
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private setupInterceptors() {
    axios.interceptors.request.use(
      (config) => {
        const token = this.accessToken || localStorage.getItem("accessToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        config.headers["X-Request-ID"] = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const newToken = await this.refreshAccessToken();
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return axios(originalRequest);
          } catch {
            window.location.href = "/login";
            return Promise.reject(error);
          }
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      const refreshToken = localStorage.getItem("refreshToken");
      const response = await axios.post(
        `${API_CONFIG.baseURL}${ENDPOINTS.auth.refresh}`,
        { refreshToken }
      );
      const { accessToken } = response.data.data;
      localStorage.setItem("accessToken", accessToken);
      this.accessToken = accessToken;
      this.refreshPromise = null;
      return accessToken;
    })();

    return this.refreshPromise;
  }

  private handleError(error: AxiosError): Error {
    if (error.response?.data && typeof error.response.data === "object" && "message" in error.response.data) {
      return new Error((error.response.data as { message: string }).message);
    }
    if (error.request) return new Error("Network error. Please check your connection.");
    return new Error("An unexpected error occurred");
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axios.get<T>(`${API_CONFIG.baseURL}${url}`, {
      ...config,
      timeout: API_CONFIG.timeout,
    });
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await axios.post<T>(`${API_CONFIG.baseURL}${url}`, data, {
      ...config,
      timeout: API_CONFIG.timeout,
    });
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await axios.put<T>(`${API_CONFIG.baseURL}${url}`, data, {
      ...config,
      timeout: API_CONFIG.timeout,
    });
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axios.delete<T>(`${API_CONFIG.baseURL}${url}`, {
      ...config,
      timeout: API_CONFIG.timeout,
    });
    return response.data;
  }
}

export const apiClient = ApiClient.getInstance();
