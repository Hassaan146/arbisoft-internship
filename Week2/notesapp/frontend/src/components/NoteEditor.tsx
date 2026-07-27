import { useEffect, useState } from 'react';
import type { Note, NoteInput } from '../types';

interface NoteEditorProps {
  editing: Note | null;
  busy: boolean;
  onSubmit: (note: NoteInput) => Promise<boolean>;
  onCancel: () => void;
}

// Glassmorphic form for creating or editing a note. Client validation is
// UX-only; the server re-validates every field.
export default function NoteEditor({ editing, busy, onSubmit, onCancel }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(editing?.title ?? '');
    setContent(editing?.content ?? '');
  }, [editing]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setError(null);
    const saved = await onSubmit({ title: title.trim(), content: content.trim() });
    // Only clear the form on a successful create; on failure keep the user's
    // input so they don't lose what they typed.
    if (saved && !editing) {
      setTitle('');
      setContent('');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="liquid-glass rounded-3xl p-6">
      <h2 className="mb-4 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
        {editing ? 'Edit note' : 'New note'}
      </h2>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        placeholder="Title"
        className="liquid-glass mb-3 w-full rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={10000}
        rows={5}
        placeholder="Write something…"
        className="liquid-glass mb-3 w-full resize-none rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none"
      />

      {error && (
        <p className="mb-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {editing ? 'Save changes' : 'Add note'}
        </button>
        {editing && (
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="liquid-glass rounded-full px-6 py-2.5 text-sm font-medium text-white"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
