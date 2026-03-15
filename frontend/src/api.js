/**
 * Real API client — used in production.
 * The App.jsx uses mockApi for the in-browser demo.
 * Import these in App.jsx and replace mockApi.* calls
 * once you are ready to connect to the live backend.
 */
const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function request(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export const realApi = {
  login:             (username, password) =>
    request("POST", "/auth/login", { username, password }),
  getDevices:        (token) =>
    request("GET", "/devices", null, token),
  getDevice:         (id, token) =>
    request("GET", `/devices/${id}`, null, token),
  createDevice:      (data, token) =>
    request("POST", "/devices", data, token),
  updateDevice:      (id, data, token) =>
    request("PUT", `/devices/${id}`, data, token),
  deleteDevice:      (id, token) =>
    request("DELETE", `/devices/${id}`, null, token),
  getStats:          (token) =>
    request("GET", "/dashboard/stats", null, token),
  getRecommendations:(id, token) =>
    request("GET", `/devices/${id}/recommendations`, null, token),
};
