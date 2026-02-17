export function getAuthHeaders(): Record<string, string> {
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

export async function handleApiResponse<T>(response: Response): Promise<T> {
  const responseClone = response.clone();
 
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const errorData = await responseClone.json();
        throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
      } catch {
        try {
          const errorText = await responseClone.text();
          if (errorText.includes('<!DOCTYPE')) {
            throw new Error(`API route not found (404) or server error.`);
          }
          throw new Error(errorText || `Request failed with status ${response.status}`);
        } catch {
          throw new Error(`Request failed with status ${response.status} ${response.statusText}`);
        }
      }
    } else {
      const errorText = await responseClone.text();
      if (errorText.includes('<!DOCTYPE')) {
        throw new Error(`API route not found. Status: ${response.status}`);
      }
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
  }
  
  const json = await response.json();
  
  if (json && typeof json === 'object' && 'success' in json) {
    if (json.success && 'data' in json) {
      return json.data as T;
    } else if (!json.success && 'error' in json) {
      throw new Error(json.error);
    }
  }
  
  return json as T;
}

export async function safeFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const headers = getAuthHeaders();
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });
  return handleApiResponse<T>(response);
}
