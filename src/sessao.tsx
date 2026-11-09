// Compartilha o usuario conectado entre todas as telas.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getSessionAuth } from '@/firebase';

type Session = { user: User | null; ready: boolean; error: string | null };
type AuthContextValue = Session & {
  refreshSession: () => void;
  retry: () => void;
  notice: string | null;
  setNotice: (notice: string | null) => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({ user: null, ready: false, error: null });
  const [notice, setNotice] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    const timer = setTimeout(() => {
      setSession(previous => ({ ...previous, ready: false, error: null }));
      try {
        unsubscribe = onAuthStateChanged(getSessionAuth(), user => {
          if (active) setSession({ user, ready: true, error: null });
        }, () => {
          if (active) setSession({ user: null, ready: true, error: 'Não foi possível recuperar sua sessão. Tente novamente.' });
        });
      } catch {
        if (active) setSession({ user: null, ready: true, error: 'Não foi possível configurar o acesso. Confira o Firebase em .env.local.' });
      }
    }, 0);
    return () => { active = false; clearTimeout(timer); unsubscribe?.(); };
  }, [revision]);
  function refreshSession() {
    setSession({ user: getSessionAuth().currentUser, ready: true, error: null });
  }
  return <AuthContext.Provider value={{ ...session, refreshSession, retry: () => setRevision(value => value + 1), notice, setNotice }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de AuthProvider.');
  return context;
}
