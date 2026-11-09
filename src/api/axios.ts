const API_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request(url: string, options: RequestInit = {}): Promise<any> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    };

    try {
      const res = await fetch(`${this.baseURL}${url}`, {
        ...options,
        headers,
      });

      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw err;
      }

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return res.json();
      }
      return res.text();
    } catch (e) {
      throw e;
    }
  }

  get(url: string, options?: { params?: Record<string, any> }) {
    let fullUrl = url;
    if (options?.params) {
      const qs = new URLSearchParams();
      Object.entries(options.params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) qs.append(k, String(v));
      });
      const query = qs.toString();
      if (query) fullUrl += (fullUrl.includes('?') ? '&' : '?') + query;
    }
    return this.request(fullUrl, { method: 'GET' });
  }

  post(url: string, data: any) {
    return this.request(url, { method: 'POST', body: JSON.stringify(data) });
  }

  put(url: string, data: any) {
    return this.request(url, { method: 'PUT', body: JSON.stringify(data) });
  }

  delete(url: string) {
    return this.request(url, { method: 'DELETE' });
  }
}

const api = new ApiClient(API_URL);
export default api;
