import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api, isApiError } from '../services/api';
import { User, UserType } from '../types';
import { clearAuthStorage, parseStoredJson } from '../lib/storageJson';

interface AuthContextData {
  user: User | null;
  userType: UserType | null;
  loading: boolean;
  login: (email: string, password: string, type: UserType) => Promise<void>;
  loginStudent: (accessCode: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

function loginErrorMessage(err: unknown, fallback: string): string {
  if (isApiError(err)) {
    const data = err.response?.data;
    if (data && typeof data === 'object' && 'error' in data) {
      const msg = (data as { error?: string }).error;
      if (msg) return msg;
    }
    if (err.response?.status === 0) return err.message;
    return err.message || fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUserType = localStorage.getItem('userType') as UserType | null;
    const parsedUser = parseStoredJson<User>(localStorage.getItem('user'));

    if (token && parsedUser && storedUserType) {
      setUser(parsedUser);
      setUserType(storedUserType);
    } else if (token || localStorage.getItem('user')) {
      // Sessão corrompida (ex.: user = "undefined" após login parcial)
      clearAuthStorage();
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, type: UserType) => {
    try {
      const response = await api.post(`/auth/${type}/login`, { email, password }, {
        validateStatus: (status) => status < 500,
      });
      if (response.status === 400 || response.status === 429) {
        throw new Error(response.data?.error || 'Erro ao fazer login');
      }
      if (response.status !== 200 || !response.data?.token) {
        throw new Error(response.data?.error || 'Erro ao fazer login');
      }
      const { user: userData, token } = response.data;
      if (!userData || !token) {
        throw new Error(response.data?.error || 'Erro ao fazer login');
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userType', type);
      setUser(userData);
      setUserType(type);
    } catch (err) {
      throw new Error(loginErrorMessage(err, 'Erro ao fazer login'));
    }
  };

  const loginStudent = async (accessCode: string) => {
    try {
      const response = await api.post('/auth/student/login', { accessCode }, {
        validateStatus: (status) => status < 500,
      });
      if (response.status === 400 || response.status === 429) {
        throw new Error(response.data?.error || 'Código inválido');
      }
      if (response.status !== 200 || !response.data?.token) {
        throw new Error(response.data?.error || 'Código inválido');
      }
      const { user: userData, token } = response.data;
      if (!userData || !token) {
        throw new Error(response.data?.error || 'Código inválido');
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userType', 'student');
      setUser(userData);
      setUserType('student');
    } catch (err) {
      throw new Error(loginErrorMessage(err, 'Código inválido'));
    }
  };

  const logout = useCallback(() => {
    clearAuthStorage();
    setUser(null);
    setUserType(null);
  }, []);

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const next = { ...user, ...data };
    setUser(next);
    localStorage.setItem('user', JSON.stringify(next));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        loading,
        login,
        loginStudent,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
