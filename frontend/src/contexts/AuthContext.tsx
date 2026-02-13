import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { User, UserType } from '../types';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedUserType = localStorage.getItem('userType') as UserType;

    if (token && storedUser && storedUserType) {
      setUser(JSON.parse(storedUser));
      setUserType(storedUserType);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, type: UserType) => {
    const response = await api.post(`/auth/${type}/login`, { email, password }, {
      validateStatus: (status) => status < 500,
    });
    if (response.status === 400 || response.status === 429) {
      throw new Error(response.data?.error || 'Erro ao fazer login');
    }
    const { user: userData, token } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('userType', type);
    setUser(userData);
    setUserType(type);
  };

  const loginStudent = async (accessCode: string) => {
    const response = await api.post('/auth/student/login', { accessCode }, {
      validateStatus: (status) => status < 500,
    });
    if (response.status === 400 || response.status === 429) {
      throw new Error(response.data?.error || 'Código inválido');
    }
    const { user: userData, token } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('userType', 'student');
    setUser(userData);
    setUserType('student');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    setUser(null);
    setUserType(null);
  };

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
