import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type UserRole = "admin" | "client";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  recoverPassword: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "@servicospro_user";
const USERS_KEY = "@servicospro_users";

const ADMIN_USER: User = {
  id: "admin-001",
  name: "Administrador",
  email: "admin@servicospro.com",
  role: "admin",
  phone: "(11) 99999-9999",
  createdAt: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (
        email === "admin@servicospro.com" &&
        password === "admin123"
      ) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ADMIN_USER));
        setUser(ADMIN_USER);
        return { success: true };
      }

      try {
        const usersRaw = await AsyncStorage.getItem(USERS_KEY);
        const users: Array<User & { password: string }> = usersRaw
          ? JSON.parse(usersRaw)
          : [];
        const found = users.find(
          (u) => u.email === email && u.password === password
        );
        if (found) {
          const { password: _p, ...userWithoutPassword } = found;
          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(userWithoutPassword)
          );
          setUser(userWithoutPassword);
          return { success: true };
        }
        return { success: false, error: "E-mail ou senha incorretos." };
      } catch {
        return { success: false, error: "Erro ao fazer login." };
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
        const usersRaw = await AsyncStorage.getItem(USERS_KEY);
        const users: Array<User & { password: string }> = usersRaw
          ? JSON.parse(usersRaw)
          : [];

        if (users.find((u) => u.email === email)) {
          return { success: false, error: "E-mail já cadastrado." };
        }

        const newUser: User & { password: string } = {
          id: `client-${Date.now()}`,
          name,
          email,
          role: "client",
          phone,
          createdAt: new Date().toISOString(),
          password,
        };

        users.push(newUser);
        await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

        const { password: _p, ...userWithoutPassword } = newUser;
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(userWithoutPassword)
        );
        setUser(userWithoutPassword);
        return { success: true };
      } catch {
        return { success: false, error: "Erro ao criar conta." };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const recoverPassword = useCallback(
    async (
      email: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!email) return { success: false, error: "Informe o e-mail." };
      return {
        success: true,
      };
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
