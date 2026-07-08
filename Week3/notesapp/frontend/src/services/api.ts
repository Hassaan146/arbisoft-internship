// The only module that knows about HTTP/endpoints. It also owns the JWT: the
// token lives in localStorage and is attached as a Bearer header on every call.

import type { AdminStats, AuthToken, Credentials, Note, NoteInput, User } from '../types';

const BASE = '/api';
const TIMEOUT_MS = 10_000;
const TOKEN_KEY = 'notesapp.token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { headers, signal: controller.signal, ...options });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw new Error('Network error. Is the server running?');
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = (data as { detail?: unknown } | null)?.detail;
    throw new Error(typeof detail === 'string' ? detail : `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  register: (creds: Credentials) =>
    request<User>('/users', { method: 'POST', body: JSON.stringify(creds) }),

  login: (creds: Credentials) =>
    request<AuthToken>('/auth/login', { method: 'POST', body: JSON.stringify(creds) }),

  resetPassword: (creds: Credentials) =>
    request<User>('/auth/reset-password', { method: 'POST', body: JSON.stringify(creds) }),

  me: () => request<User>('/users/me'),

  listNotes: () => request<Note[]>('/notes'),

  createNote: (note: NoteInput) =>
    request<Note>('/notes', { method: 'POST', body: JSON.stringify(note) }),

  updateNote: (noteId: number, note: Partial<NoteInput>) =>
    request<Note>(`/notes/${noteId}`, { method: 'PUT', body: JSON.stringify(note) }),

  deleteNote: (noteId: number) => request<void>(`/notes/${noteId}`, { method: 'DELETE' }),

  adminStats: () => request<AdminStats>('/admin/stats'),
};
