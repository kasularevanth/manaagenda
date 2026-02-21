import { createContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { login, logout, refreshSession } from "../services/auth.service";
import type { User } from "../types/api";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type Props = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: Props) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrateSession = async () => {
      try {
        const nextUser = await refreshSession();
        setUser(nextUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    void hydrateSession();
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setLoading(false);
    };

    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", onUnauthorized);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn: async (email, password) => {
        const nextUser = await login(email, password);
        setUser(nextUser);
      },
      signOut: async () => {
        await logout();
        setUser(null);
      },
      setUser,
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
