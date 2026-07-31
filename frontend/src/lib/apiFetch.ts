/**
 * apiFetch — Wrapper fetch terpusat
 *
 * Menambahkan Authorization header secara otomatis dari localStorage,
 * dan menangani 401 Unauthorized secara global dengan redirect ke /login
 * disertai pesan "Sesi habis, silakan login ulang."
 *
 * Gunakan sebagai pengganti `fetch()` di seluruh frontend.
 */

const API_BASE = 'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handleUnauthorized() {
  // Hapus kredensial lama
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Simpan pesan ke sessionStorage agar LoginPage bisa menampilkannya
  sessionStorage.setItem('auth_expired', '1');
  // Redirect ke login
  window.location.replace('/login');
}

/**
 * apiFetch wraps the native fetch with:
 * - Automatic Authorization header
 * - Automatic 401 redirect to /login
 * - Content-Type: application/json for JSON bodies
 *
 * @param path  Endpoint path, e.g. '/dashboard/stats'
 * @param init  Standard RequestInit options (method, body, headers, ...)
 * @returns     The Response object (same as native fetch)
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(init.headers as Record<string, string> | undefined),
  };

  // Auto-add Content-Type if body is a string/JSON
  if (init.body && typeof init.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (res.status === 401) {
    handleUnauthorized();
    // Return a never-resolving promise since we're redirecting
    return new Promise(() => {});
  }

  return res;
}
