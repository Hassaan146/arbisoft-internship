// The only module that knows about HTTP/endpoints.

import type { Note, NoteInput } from '../types';

const BASE = '/api';
const TIMEOUT_MS = 10_000;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

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
  listNotes: () => request<Note[]>('/notes'),

  createNote: (note: NoteInput) =>
    request<Note>('/notes', { method: 'POST', body: JSON.stringify(note) }),

  updateNote: (noteId: number, note: Partial<NoteInput>) =>
    request<Note>(`/notes/${noteId}`, { method: 'PUT', body: JSON.stringify(note) }),

  deleteNote: (noteId: number) => request<void>(`/notes/${noteId}`, { method: 'DELETE' }),
};
