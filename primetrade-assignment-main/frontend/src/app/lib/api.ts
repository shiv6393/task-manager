import axios from 'axios';
import { User, Task, Project, AuthResponse } from '@/src/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Enhanced error class with more context
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'APIError';
    
    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }
}

// Request/response logging levels
type LogLevel = 'none' | 'error' | 'info' | 'debug';
const LOG_LEVEL: LogLevel = (process.env.NEXT_PUBLIC_API_LOG_LEVEL as LogLevel) || 'error';

const shouldLog = (level: LogLevel): boolean => {
  const levels: Record<LogLevel, number> = { none: 0, error: 1, info: 2, debug: 3 };
  return levels[level] <= levels[LOG_LEVEL];
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Set to true if using cookies
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (shouldLog('debug')) {
      console.log(`🔄 API ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params
      });
    }

    return config;
  },
  (error) => {
    if (shouldLog('error')) {
      console.error('❌ Request error:', error);
    }
    return Promise.reject(new APIError(
      'Failed to send request. Please check your connection.',
      undefined,
      undefined,
      error
    ));
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (shouldLog('debug')) {
      console.log(`✅ ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    
    if (shouldLog('error')) {
      console.error('❌ API Error:', {
        url: originalRequest?.url,
        method: originalRequest?.method,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
    }

    // Extract user-friendly message
    let userMessage = 'Something went wrong. Please try again.';
    let status = error.response?.status;
    
    if (error.response?.data?.message) {
      userMessage = error.response.data.message;
    } else if (error.message.includes('Network Error') || error.message.includes('CORS')) {
      userMessage = 'Cannot connect to server. Please check if the backend is running and try again.';
      status = 0; // Network error
    } else if (error.code === 'ECONNABORTED') {
      userMessage = 'Request timeout. Please check your internet connection and try again.';
      status = 408;
    }

    // Handle specific status codes
    switch (error.response?.status) {
      case 400:
        userMessage = error.response.data?.message || 'Bad request. Please check your input.';
        break;
      
      case 401:
  // Don't treat login failures as session expiry
  const isLoginRequest = originalRequest?.url === '/auth/login' || 
                        originalRequest?.url?.endsWith('/auth/login');
  
  if (isLoginRequest) {
    // Use the server's message for login failures
    userMessage = error.response.data?.message || 'Invalid email or password';
  } else {
    // Auto-logout on 401 for other requests (session expired)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('token_expiry');
      if (!window.location.pathname.includes('/login')) {
        setTimeout(() => {
          window.location.href = '/login?session_expired=true';
        }, 100);
      }
    }
    userMessage = 'Your session has expired. Please log in again.';
  }
  break;
      
      case 403:
        userMessage = 'You do not have permission to perform this action.';
        break;
      
      case 404:
        userMessage = 'The requested resource was not found.';
        break;
      
      case 409:
        userMessage = error.response.data?.message || 'A conflict occurred. This resource may already exist.';
        break;
      
      case 422:
        userMessage = 'Validation failed. Please check your input.';
        break;
      
      case 429:
        userMessage = 'Too many requests. Please slow down.';
        break;
      
      case 500:
        userMessage = 'Server error. Please try again later.';
        break;
      
      case 502:
      case 503:
      case 504:
        userMessage = 'Service temporarily unavailable. Please try again later.';
        break;
    }

    return Promise.reject(new APIError(
      userMessage,
      status,
      error.code,
      error
    ));
  }
);

// Enhanced API methods with better typing
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data.data;
  },
  
  register: async (name: string, email: string, password: string, role: string = 'member'): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { name, email, password, role });
    return response.data.data;
  },
  
  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data.data;
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await api.put('/auth/profile', userData);
    return response.data.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.put('/auth/change-password', { currentPassword, newPassword });
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await api.post('/auth/reset-password', { token, password });
  },

  verifyEmail: async (token: string): Promise<void> => {
    await api.post('/auth/verify-email', { token });
  },

  resendVerification: async (email: string): Promise<void> => {
    await api.post('/auth/resend-verification', { email });
  }
};

export const taskAPI = {
  getTasks: async (params?: { 
    page?: number; 
    limit?: number; 
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<{ tasks: Task[]; total: number; page: number; totalPages: number }> => {
    const response = await api.get('/tasks', { params });
    return {
      tasks: response.data.data,
      total: response.data.total || response.data.data.length,
      page: response.data.page || 1,
      totalPages: response.data.totalPages || 1
    };
  },
  
  getTask: async (id: string): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data.data;
  },
  
  createTask: async (task: Omit<Task, '_id' | 'createdAt' | 'updatedAt' | 'user'>): Promise<Task> => {
    const response = await api.post('/tasks', task);
    return response.data.data;
  },
  
  updateTask: async (id: string, task: Partial<Task>): Promise<Task> => {
    const response = await api.put(`/tasks/${id}`, task);
    return response.data.data;
  },
  
  deleteTask: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  updateTaskStatus: async (id: string, status: string): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}/status`, { status });
    return response.data.data;
  },

  updateTaskPriority: async (id: string, priority: string): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}/priority`, { priority });
    return response.data.data;
  },

  // Bulk operations
  deleteTasks: async (ids: string[]): Promise<void> => {
    await api.post('/tasks/bulk-delete', { ids });
  },

  updateTasksStatus: async (ids: string[], status: string): Promise<void> => {
    await api.post('/tasks/bulk-status', { ids, status });
  }
};

export const projectAPI = {
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get('/projects');
    return response.data.data;
  },

  getProject: async (id: string): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data.data;
  },

  createProject: async (data: { name: string; description?: string }): Promise<Project> => {
    const response = await api.post('/projects', data);
    return response.data.data;
  },

  addMember: async (projectId: string, email: string, role: string = 'member'): Promise<Project> => {
    const response = await api.post(`/projects/${projectId}/members`, { email, role });
    return response.data.data;
  }
};

// Utility function to check if error is an APIError
export const isAPIError = (error: unknown): error is APIError => {
  return error instanceof APIError;
};

// Utility to get error message safely
export const getErrorMessage = (error: unknown): string => {
  if (isAPIError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

// Utility to check if we're online
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

// Retry mechanism for failed requests
export const retryRequest = async <T>(
  request: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await request();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Only retry on network errors or 5xx status codes
      if (isAPIError(error) && error.status && error.status >= 500) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        continue;
      }
      
      throw error;
    }
  }
  
  throw new APIError('Max retries exceeded');
};

export default api;