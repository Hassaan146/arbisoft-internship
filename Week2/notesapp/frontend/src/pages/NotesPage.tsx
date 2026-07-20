import { useState } from 'react';
import { LayoutDashboard, LogOut, NotebookPen, Pencil, Trash2 } from 'lucide-react';
import BackgroundVideo from '../components/BackgroundVideo';
import NoteEditor from '../components/NoteEditor';
import { useNotes } from '../hooks/useNotes';
import type { Note, NoteInput, User } from '../types';

interface NotesPageProps {
  user: User;
  onLogout: () => void;
  onOpenAdmin?: () => void;
}

// The logged-in workspace. Same cinematic video + liquid-glass vibe as the
// landing page, with a darker overlay so the note text stays readable.
export default function NotesPage({ user, onLogout, onOpenAdmin }: NotesPageProps) {
  const { notes, loading, error, createNote, updateNote, deleteNote } = useNotes();
  const [editing, setEditing] = useState<Note | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Returns true only when the save succeeded, so the editor knows whether it
  // is safe to clear the user's input (a failed create must keep it).
  async function handleSubmit(payload: NoteInput): Promise<boolean> {
    setBusy(true);
    setActionError(null);
    try {
      if (editing) {
        await updateNote(editing.id, payload);
        setEditing(null);
      } else {
        await createNote(payload);
      }
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not save the note.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(note: Note) {
    setActionError(null);
    try {
      await deleteNote(note.id);
      if (editing?.id === note.id) setEditing(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete the note.');
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <BackgroundVideo />
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <header className="liquid-glass mb-8 flex items-center justify-between rounded-full px-6 py-3">
          <div className="flex items-center gap-2">
            <NotebookPen size={22} className="text-white" />
            <span className="text-lg font-semibold text-white">Notes</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/70">
              Hi, <span className="text-white">{user.username}</span>
            </span>
            {user.role === 'admin' && onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="liquid-glass flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white"
              >
                <LayoutDashboard size={16} /> Admin
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="liquid-glass flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_360px]">
          {/* Notes list */}
          <section>
            <h1
              className="mb-4 text-4xl text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Your notes
            </h1>

            {actionError && (
              <p className="mb-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {actionError}
              </p>
            )}

            {loading ? (
              <p className="text-white/60">Loading notes…</p>
            ) : error ? (
              <p className="text-red-300">Could not load notes: {error}</p>
            ) : notes.length === 0 ? (
              <div className="liquid-glass rounded-3xl px-6 py-12 text-center text-white/60">
                No notes yet. Create your first one on the right →
              </div>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <article key={note.id} className="liquid-glass rounded-3xl p-5">
                    <h3 className="mb-1 text-lg font-semibold text-white">{note.title}</h3>
                    {note.content && (
                      <p className="mb-3 whitespace-pre-wrap text-sm text-white/70">
                        {note.content}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(note)}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(note)}
                        aria-label={`Delete note ${note.title}`}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-red-300 transition-colors hover:bg-red-500/10"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Editor */}
          <aside className="md:sticky md:top-8 md:self-start">
            <NoteEditor
              editing={editing}
              busy={busy}
              onSubmit={handleSubmit}
              onCancel={() => setEditing(null)}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
