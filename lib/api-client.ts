import toast from 'react-hot-toast';

interface ApiClientOptions extends RequestInit {
  skipToast?: boolean;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

export async function apiClient<T>(
  url: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { skipToast = false, ...fetchOptions } = options;
  
  const headers = {
    ...getAuthHeaders(),
    ...fetchOptions.headers,
  };

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      if (!response.ok) {
        throw new ApiError(response.status, text || `Request failed with status ${response.status}`);
      }
      return text as T;
    }

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
      
      if (!skipToast) {
        if (response.status === 401) {
          toast.error('Session expired. Please login again.');
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          toast.error(errorMessage);
        }
      }
      
      throw new ApiError(response.status, errorMessage);
    }

    if (data && typeof data === 'object' && 'success' in data) {
      if (data.success && 'data' in data) {
        return data.data as T;
      } else if (!data.success && 'error' in data) {
        throw new ApiError(400, data.error);
      }
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (!skipToast) {
      toast.error('Network error. Please try again.');
    }
    
    throw new ApiError(0, 'Network error');
  }
}

export const api = {
  get: <T>(url: string, options?: ApiClientOptions) => 
    apiClient<T>(url, { ...options, method: 'GET' }),
  
  post: <T>(url: string, body?: unknown, options?: ApiClientOptions) => 
    apiClient<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  
  put: <T>(url: string, body?: unknown, options?: ApiClientOptions) => 
    apiClient<T>(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  
  delete: <T>(url: string, options?: ApiClientOptions) => 
    apiClient<T>(url, { ...options, method: 'DELETE' }),
};
