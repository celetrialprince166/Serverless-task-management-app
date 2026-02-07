/**
 * API Client Service
 * Axios instance with Cognito JWT authentication
 */
import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { apiConfig } from '@/config/amplify-config';
import type { ApiError } from '@/types/api';

// Create axios instance
const api = axios.create({
    baseURL: apiConfig.baseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            if (token) {
                config.headers.Authorization = token;
            }
        } catch (error) {
            // User might not be authenticated - let the request proceed
            // The backend will return 401 if auth is required
            console.debug('No auth session available');
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - redirect to login
            // Clear any local state and redirect
            window.location.href = '/login';
        }

        // Extract error message for display
        const message = error.response?.data?.message
            || error.message
            || 'An unexpected error occurred';

        console.error('API Error:', {
            status: error.response?.status,
            message,
            path: error.config?.url,
        });

        return Promise.reject(error);
    }
);

export default api;
