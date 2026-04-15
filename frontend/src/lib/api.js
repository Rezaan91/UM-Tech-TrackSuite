const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  import.meta.env.NEXT_PUBLIC_API_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

const STORAGE_KEY = 'tracksuite-user';

export const buildApiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem(STORAGE_KEY);
    if (!rawUser) {
      return null;
    }

    return JSON.parse(rawUser);
  } catch {
    return null;
  }
};

export const buildAuthHeaders = () => {
  const user = getStoredUser();

  if (!user) {
    return {};
  }

  return {
    'x-user-id': user.id || 'demo-admin',
    'x-user-email': user.email || 'demo@tracksuite.com',
    'x-user-role': user.role || 'ADMIN',
    'x-user-name': user.name || 'TrackSuite User',
    'x-company-id': user.companyId || 'demo-company',
  };
};

export const apiFetch = async (path, options = {}) => {
  const mergedHeaders = {
    ...buildAuthHeaders(),
    ...(options.headers || {}),
  };

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: mergedHeaders,
  });

  const hasJsonResponse = response.headers.get('content-type')?.includes('application/json');
  const data = hasJsonResponse ? await response.json() : null;

  if (!response.ok) {
    const errorMessage = data?.error || 'Request failed';
    throw new Error(errorMessage);
  }

  return data;
};

export { API_BASE_URL };
