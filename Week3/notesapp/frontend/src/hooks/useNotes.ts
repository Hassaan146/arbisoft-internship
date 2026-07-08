import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import type { Note, NoteInput } from '../types';

// Encapsulates note data-fetching + mutations and the async UI states
// (loading / error). Notes belong to whoever the JWT identifies, so no user
// id is passed — the server derives it from the token.
export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Each refresh() bumps this; an older in-flight response is dropped.
  const loadIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const loadId = ++loadIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await api.listNotes();
      if (loadId !== loadIdRef.current) return;
      setNotes(result);
    } catch (err) {
      if (loadId !== loadIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      if (loadId === loadIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createNote = useCallback(
    async (note: NoteInput) => {
      await api.createNote(note);
      await refresh();
    },
    [refresh]
  );

  const updateNote = useCallback(
    async (noteId: number, note: Partial<NoteInput>) => {
      await api.updateNote(noteId, note);
      await refresh();
    },
    [refresh]
  );

  const deleteNote = useCallback(
    async (noteId: number) => {
      await api.deleteNote(noteId);
      await refresh();
    },
    [refresh]
  );

  return { notes, loading, error, refresh, createNote, updateNote, deleteNote };
}
