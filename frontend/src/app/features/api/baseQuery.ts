import axiosInstance from '@/lib/axios';
import type { BaseQueryRequest } from '@/types';

/** Error data shape */
export interface ErrorData {
  message?: string | undefined;
  errors?: Record<string, string[]> | undefined;
  [key: string]: unknown;
}

/** Error shape returned by the base query */
export interface BaseQueryError {
  status: number;
  data?: ErrorData | undefined;
  message?: string | undefined;
}

/**
 * Custom base query using axios for RTK Query.
 * Handles authentication via HTTP-only cookies.
 */
export const axiosBaseQuery = async ({
  url,
  method = 'GET',
  body,
  data,
  params,
}: BaseQueryRequest): Promise<
  { data: unknown } | { error: BaseQueryError }
> => {
  try {
    const result = await axiosInstance({
      url,
      method,
      data: data ?? body,
      params: params as Record<string, unknown>,
    });
    return { data: result.data };
  } catch (error: unknown) {
    const axiosError = error as {
      response?: { status?: number; data?: unknown };
      message?: string;
    };
    const errorData = axiosError.response?.data as ErrorData | undefined;
    return {
      error: {
        status: axiosError.response?.status ?? 500,
        ...(errorData !== undefined ? { data: errorData } : {}),
        ...(axiosError.message !== undefined
          ? { message: axiosError.message }
          : {}),
      },
    };
  }
};

