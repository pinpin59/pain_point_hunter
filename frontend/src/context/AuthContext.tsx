import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User, LoginDto, RegisterDto } from "@pain-point-hunter/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifie si l'utilisateur est connecté au chargement de l'app
  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: User | null) => setUser(data))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (dto: LoginDto) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message ?? "Erreur de connexion");
    }

    const data: { user: User } = await res.json();
    setUser(data.user);
  };

  const register = async (dto: RegisterDto) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message ?? "Erreur d'inscription");
    }

    const data: { user: User } = await res.json();
    setUser(data.user);
  };

  const logout = async () => {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
