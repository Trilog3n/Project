const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getTokens() {
  if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
  };
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = getTokens();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data.tokens.accessToken;
  } catch {
    return null;
  }
}

export async function api<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const { accessToken } = getTokens();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let res = await fetch(`${API_URL}/api/v1${endpoint}`, { ...options, headers });

  if (res.status === 401 && accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_URL}/api/v1${endpoint}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(res.status, error.message || 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const authApi = {
  register: (data: { name: string; email: string; password: string; phone?: string; role?: string }) =>
    api<{ user: unknown; tokens: { accessToken: string; refreshToken: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  registerVendor: (data: Record<string, unknown>) =>
    api<{ user: unknown; tokens: { accessToken: string; refreshToken: string } }>('/auth/register/vendor', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (email: string, password: string) =>
    api<{ user: unknown; tokens: { accessToken: string; refreshToken: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  forgotPassword: (email: string) =>
    api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) =>
    api('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
};

export const vendorsApi = {
  search: (params: Record<string, string | number | boolean | undefined>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.set(k, String(v));
    });
    return api(`/vendors/search?${query}`);
  },
  featured: (city?: string) => api(`/vendors/featured${city ? `?city=${city}` : ''}`),
  getById: (id: string) => api(`/vendors/${id}`),
  getMyProfile: () => api('/vendors/me/profile'),
  updateProfile: (data: Record<string, unknown>) =>
    api('/vendors/me/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  getDashboard: () => api('/vendors/me/dashboard'),
};

export const categoriesApi = {
  getAll: () => api('/categories'),
};

export const bookingsApi = {
  create: (data: Record<string, unknown>) =>
    api('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  getMy: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api(`/bookings/my${query}`);
  },
  getVendor: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api(`/bookings/vendor${query}`);
  },
  getById: (id: string) => api(`/bookings/${id}`),
  updateStatus: (id: string, status: string) =>
    api(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  proposeTime: (id: string, proposedDate: string, proposedTime: string) =>
    api(`/bookings/${id}/propose-time`, {
      method: 'PATCH',
      body: JSON.stringify({ proposedDate, proposedTime }),
    }),
  confirmTime: (id: string) =>
    api(`/bookings/${id}/confirm-time`, { method: 'PATCH' }),
};

export const servicesApi = {
  getByVendor: (vendorId: string) => api(`/services/vendor/${vendorId}`),
  getMy: () => api('/services/my'),
  create: (data: Record<string, unknown>) =>
    api('/services', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    api(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => api(`/services/${id}`, { method: 'DELETE' }),
};

export const reviewsApi = {
  create: (data: Record<string, unknown>) =>
    api('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  getByVendor: (vendorId: string) => api(`/reviews/vendor/${vendorId}`),
};

export const adminApi = {
  getDashboard: () => api('/admin/dashboard'),
  getPendingVendors: () => api('/admin/vendors/pending'),
  verifyVendor: (id: string, approved: boolean) =>
    api(`/admin/vendors/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ approved }) }),
  getUsers: (role?: string) => api(`/admin/users${role ? `?role=${role}` : ''}`),
  suspendUser: (id: string) => api(`/admin/users/${id}/suspend`, { method: 'PATCH' }),
  activateUser: (id: string) => api(`/admin/users/${id}/activate`, { method: 'PATCH' }),
  getBookings: (status?: string) => api(`/admin/bookings${status ? `?status=${status}` : ''}`),
  getReviews: () => api('/admin/reviews'),
  deleteReview: (id: string) => api(`/admin/reviews/${id}`, { method: 'DELETE' }),
  getPendingDocuments: () => api('/admin/documents/pending'),
  approveDocument: (id: string) => api(`/admin/documents/${id}/approve`, { method: 'PATCH' }),
  rejectDocument: (id: string) => api(`/admin/documents/${id}/reject`, { method: 'PATCH' }),
  getComplaints: (status?: string) => api(`/complaints${status ? `?status=${status}` : ''}`),
};

export const usersApi = {
  getMe: () => api('/users/me'),
  updateMe: (data: Record<string, unknown>) =>
    api('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
};
