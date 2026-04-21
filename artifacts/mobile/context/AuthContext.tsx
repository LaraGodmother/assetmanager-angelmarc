import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, setAuthToken, type ApiUser } from "@/lib/api";

export type UserRole = "admin" | "client";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  recoverPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = "@servcontrol_session";

function apiUserToUser(u: ApiUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    createdAt: u.createdAt,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const { user: u, token } = JSON.parse(stored) as { user: User; token: string };
          if (u) setUser(u);
          if (token) setAuthToken(token);
        }
      } catch {}
      finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
      try {
        const { user: apiUser, token } = await api.login(email, password);
        const u = apiUserToUser(apiUser);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u, token }));
        setUser(u);
        setAuthToken(token);
        return { success: true, role: u.role };
      } catch (err: any) {
        return { success: false, error: err?.message ?? "Erro ao fazer login." };
      }
    },
    []
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      phone?: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const { user: apiUser, token } = await api.register(name, email, password, phone);
        const u = apiUserToUser(apiUser);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u, token }));
        setUser(u);
        setAuthToken(token);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message ?? "Erro ao criar conta." };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setAuthToken(null);
  }, []);

  const recoverPassword = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      if (!email) return { success: false, error: "Informe o e-mail." };
      return { success: true };
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        recoverPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
