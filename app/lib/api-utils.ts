 export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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
        // If JSON parsing fails, try text
        try {
          const errorText = await responseClone.text();
          if (errorText.includes('<!DOCTYPE')) {
            throw new Error(`API route not found (404) or server error. Please check if the backend route exists.`);
          }
          throw new Error(errorText || `Request failed with status ${response.status}`);
        } catch {
          throw new Error(`Request failed with status ${response.status} ${response.statusText}`);
        }
      }
    } else {
      const errorText = await responseClone.text();
      if (errorText.includes('<!DOCTYPE')) {
        throw new Error(`API route not found. The server returned an HTML error page. Status: ${response.status}`);
      }
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
  }
  
  // For successful responses, read the original response
  return response.json();
}

// Simple fetch wrapper that prevents multiple reads
export async function safeFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const headers = getAuthHeaders();
   let fullUrl = url;
  if (url.startsWith('/api/')) {
     const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    fullUrl = `${backendUrl}${url}`;
  }
  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });
  return handleApiResponse<T>(response);
}