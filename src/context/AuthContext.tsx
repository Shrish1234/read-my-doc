import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthUser {
  name: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

interface StoredUser {
  name: string;
  hashedPassword: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('focusos-auth');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('focusos-auth');
      }
    }
  }, []);

  const getUsers = (): Record<string, StoredUser> => {
    try {
      return JSON.parse(localStorage.getItem('focusos-users') || '{}');
    } catch {
      return {};
    }
  };

  const login = (email: string, password: string): boolean => {
    const users = getUsers();
    const entry = users[email.toLowerCase()];
    if (!entry || entry.hashedPassword !== djb2Hash(password)) return false;
    const authUser = { name: entry.name, email: email.toLowerCase() };
    setUser(authUser);
    localStorage.setItem('focusos-auth', JSON.stringify(authUser));
    return true;
  };

  const signup = (name: string, email: string, password: string): boolean => {
    const users = getUsers();
    const key = email.toLowerCase();
    if (users[key]) return false;
    users[key] = { name, hashedPassword: djb2Hash(password) };
    localStorage.setItem('focusos-users', JSON.stringify(users));
    const authUser = { name, email: key };
    setUser(authUser);
    localStorage.setItem('focusos-auth', JSON.stringify(authUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('focusos-auth');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
