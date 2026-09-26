import { getIdToken } from "./auth";
import type { ShowStatus } from "./types";

const API_URL = import.meta.env.VITE_API_URL;

async function request(path: string, options: RequestInit = {}) {
  const token = getIdToken();
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export const api = {
  listShows: () => request("/shows"),
  getMyStatuses: () => request("/me/statuses"),
  setStatus: (showId: string, status: ShowStatus) =>
    request(`/me/statuses/${encodeURIComponent(showId)}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  listUsers: () => request("/users"),
  getUserStatuses: (userId: string) => request(`/users/${encodeURIComponent(userId)}/statuses`),
  compare: (userId: string) => request(`/compare/${encodeURIComponent(userId)}`),
};
