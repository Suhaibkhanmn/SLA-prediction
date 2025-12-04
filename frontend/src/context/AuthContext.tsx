import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

type Role = "admin" | "operator" | "viewer";

type AuthState = {
  token: string | null;
  role: Role | null;
  email: string | null;
};

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthState;
  login: (token: string, role: Role, email: string) => void;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

const STORAGE_KEY = "sla_auth";

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthState>({
    token: null,
    role: null,
    email: null,
  });

  const isAuthenticated = !!user.token;

  // Load from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setUser({
          token: parsed.token ?? null,
          role: parsed.role ?? null,
          email: parsed.email ?? null,
        });
      } catch {
        // ignore bad data
      }
    }
  }, []);

  const login = (token: string, role: Role, email: string) => {
    const next: AuthState = { token, role, email };
    setUser(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const logout = () => {
    setUser({ token: null, role: null, email: null });
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasRole = (...roles: Role[]) => {
    if (!user.role) return false;
    return roles.includes(user.role);
  };

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      login,
      logout,
      hasRole,
    }),
    [isAuthenticated, user]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};
