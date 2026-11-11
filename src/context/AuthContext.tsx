import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

import api from '../api/axios';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  branch_id?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isDemo: boolean;
  canAccess: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );

  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  // Restore saved login session
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
      try {
        const parsedUser: User = JSON.parse(savedUser);

        setUser(parsedUser);
        setToken(savedToken);
        setIsDemo(false);
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      }
    }

    setLoading(false);
  }, []);

  // Real backend login only
  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', {
      email,
      password,
    });

    const newToken = res.token || res.data?.token;
    const newUser = res.user || res.data?.user;

    if (!newToken || !newUser) {
      throw new Error('Invalid response from server');
    }

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);
    setIsDemo(false);
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setToken(null);
    setUser(null);
    setIsDemo(false);
  };

  // Role-based access
  const canAccess = (path: string) => {
    const role = user?.role;

    if (!role) return false;

    if (role === 'admin') return true;

    const cashierPaths = [
      '/pos',
      '/sales',
      '/customers',
      '/products',
      '/invoice',
      '/',
    ];

    const inventoryPaths = [
      '/products',
      '/inventory',
      '/purchases',
      '/invoice',
      '/',
    ];

    if (role === 'cashier') {
      return cashierPaths.some(
        (p) => path === p || path.startsWith(p + '/')
      );
    }

    if (role === 'inventory_manager') {
      return inventoryPaths.some(
        (p) => path === p || path.startsWith(p + '/')
      );
    }

    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        isDemo,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
}