import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, AuthState, LoginData, RegisterData } from '../types/auth';

const AUTH_STORAGE_KEY = 'rami_auth';
const USERS_STORAGE_KEY = 'rami_users';

type AuthContextValue = AuthState & {
  login: (data: LoginData) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          user: parsed.user,
          isAuthenticated: !!parsed.user,
        } as AuthState;
      }
    } catch (error) {
      console.error('Erro ao carregar dados de autenticação:', error);
    }
    return { user: null, isAuthenticated: false } as AuthState;
  });

  useEffect(() => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
    } catch (error) {
      console.error('Erro ao salvar dados de autenticação:', error);
    }
  }, [authState]);

  const getStoredUsers = (): User[] => {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      return [];
    }
  };

  const saveUser = (user: User) => {
    try {
      const users = getStoredUsers();
      const updatedUsers = [...users, user];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      throw new Error('Erro ao salvar dados do usuário');
    }
  };

  const login = async (data: LoginData): Promise<{ success: boolean; error?: string }> => {
    try {
      const users = getStoredUsers();
      const user = users.find((u) => u.email === data.email);

      if (!user) {
        return { success: false, error: 'Email não encontrado' };
      }

      const storedPassword = localStorage.getItem(`password_${user.id}`);
      if (storedPassword !== data.password) {
        return { success: false, error: 'Senha incorreta' };
      }

      setAuthState({ user, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro interno. Tente novamente.' };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      if (data.password !== data.confirmPassword) {
        return { success: false, error: 'As senhas não coincidem' };
      }

      if (data.password.length < 6) {
        return { success: false, error: 'A senha deve ter pelo menos 6 caracteres' };
      }

      const users = getStoredUsers();
      const existingUser = users.find((u) => u.email === data.email);
      if (existingUser) {
        return { success: false, error: 'Este email já está cadastrado' };
      }

      const newUser: User = {
        id: Date.now().toString(),
        name: data.name,
        email: data.email,
        createdAt: new Date().toISOString(),
      };

      saveUser(newUser);
      localStorage.setItem(`password_${newUser.id}`, data.password);

      setAuthState({ user: newUser, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return { success: false, error: 'Erro interno. Tente novamente.' };
    }
  };

  const logout = () => {
    setAuthState({ user: null, isAuthenticated: false });
  };

  const value = useMemo<AuthContextValue>(
    () => ({ ...authState, login, register, logout }),
    [authState.user, authState.isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  }
  return ctx;
}

