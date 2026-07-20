// Shared domain types mirroring the backend's response shapes.

export interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface NoteInput {
  title: string;
  content: string;
}
