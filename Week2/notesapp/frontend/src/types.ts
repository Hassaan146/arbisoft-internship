// Shared domain types mirroring the backend's response shapes.

export interface User {
  id: number;
  username: string;
  role: string; // "user" | "admin"
  created_at: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface NoteInput {
  title: string;
  content: string;
}

export interface Credentials {
  username: string;
  password: string; // 4-digit PIN
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  role: string;
}

export interface AdminStats {
  total_users: number;
  users_logged_in: number;
  total_logins: number;
  total_notes: number;
}
