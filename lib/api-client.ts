import toast from 'react-hot-toast';

export interface ApiError extends Error {
  status?: number;
  code?: string;
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

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    const isLoginEndpoint = response.url.includes('/api/auth/login');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      errorMessage = data.error || data.message || errorMessage;
      
      if (response.status === 401) {
        // For login endpoint, show the specific error message (e.g., "Invalid email or password")
        // For other endpoints, show session expired
        if (isLoginEndpoint) {
          toast.error(errorMessage);
        } else if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          toast.error('Session expired. Please login again.');
          window.location.href = '/login';
        }
      } else {
        toast.error(errorMessage);
      }
    }
    
    const error: ApiError = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }
  
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    
    if (data && typeof data === 'object' && 'success' in data) {
      if (data.success && 'data' in data) {
        return data.data as T;
      } else if (!data.success && 'error' in data) {
        toast.error(data.error);
        const error: ApiError = new Error(data.error);
        error.status = 400;
        throw error;
      }
    }
    
    return data as T;
  }
  
  return {} as T;
}

export const api = {
  async get<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      method: 'GET',
      headers: { ...getAuthHeaders(), ...options?.headers }
    });
    return handleResponse<T>(response);
  },

  async post<T>(url: string, body?: unknown, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      method: 'POST',
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined
    });
    return handleResponse<T>(response);
  },

  async put<T>(url: string, body?: unknown, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      method: 'PUT',
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined
    });
    return handleResponse<T>(response);
  },

  async delete<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse<T>(response);
  }
};

export default api;
