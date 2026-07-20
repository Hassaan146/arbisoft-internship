import { useCallback, useEffect, useState } from 'react';
import { api, getToken, setToken } from '../services/api';
import type { Credentials, User } from '../types';

// Owns the session: holds the JWT (in localStorage via api) and the current
// user. On load it restores the session by asking the server who the token
// belongs to, so a tampered/expired token simply logs the user out.
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    let active = true;
    api
      .me()
      .then((u) => active && setUser(u))
      .catch(() => setToken(null)) // invalid/expired token → drop it
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (creds: Credentials) => {
    const token = await api.login(creds);
    setToken(token.access_token);
    setUser(await api.me());
  }, []);

  const register = useCallback(async (creds: Credentials) => {
    await api.register(creds); // creating also logs you straight in
    const token = await api.login(creds);
    setToken(token.access_token);
    setUser(await api.me());
  }, []);

  const resetPassword = useCallback(async (creds: Credentials) => {
    await api.resetPassword(creds); // does not log in; user signs in after
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return { user, loading, login, register, resetPassword, logout };
}
