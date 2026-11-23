import {
  createContext,
  useContext,
  useState,
} from "react";
import type { ReactNode } from "react";

import { login } from "../features/auth/services/auth.api";
import { clearAccessToken } from "../services/api";
import type {
  AuthenticatedUser,
  LoginInput,
} from "../features/auth/types/auth.types";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (credentials: LoginInput) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function signIn(credentials: LoginInput): Promise<void> {
    setIsLoading(true);

    try {
      const authenticatedUser = await login(credentials);
      setUser(authenticatedUser);
    } finally {
      setIsLoading(false);
    }
  }

  function signOut(): void {
    clearAccessToken();
    setUser(null);
  }

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuthContext must be used inside an AuthProvider.",
    );
  }

  return context;
}