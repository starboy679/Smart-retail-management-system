import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
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

const DEMO_USER: User = {
  id: 1,
  name: 'أحمد مصطفى',
  email: 'admin@falcon.com',
  role: 'admin',
  branch_id: 1,
};

const DEMO_TOKEN = 'demo-jwt-token-falcon-2025';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
        setIsDemo(savedToken === DEMO_TOKEN);
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Demo mode: always login immediately with demo credentials
    if (email === 'admin@falcon.com' && password === 'admin123') {
      try {
        // Try real backend first (silent)
        const res = await api.post('/auth/login', { email, password });
        const token = res.token || res.data?.token;
        const user = res.user || res.data?.user;
        if (token && user) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          setToken(token);
          setUser(user);
          setIsDemo(false);
          return;
        }
      } catch {
        // Backend offline — use demo mode silently
      }
      localStorage.setItem('token', DEMO_TOKEN);
      localStorage.setItem('user', JSON.stringify(DEMO_USER));
      setToken(DEMO_TOKEN);
      setUser(DEMO_USER);
      setIsDemo(true);
      return;
    }

    // Non-demo credentials: try backend only
    const res = await api.post('/auth/login', { email, password });
    const token = res.token || res.data?.token;
    const user = res.user || res.data?.user;
    if (!token || !user) {
      throw new Error('Invalid response from server');
    }
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    setIsDemo(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsDemo(false);
  };

  const canAccess = (path: string) => {
    const role = user?.role;
    if (!role) return false;
    if (role === 'admin') return true;

    const cashierPaths = ['/pos', '/sales', '/customers', '/products', '/invoice', '/'];
    const inventoryPaths = ['/products', '/inventory', '/purchases', '/invoice', '/'];

    if (role === 'cashier') {
      return cashierPaths.some((p) => path === p || path.startsWith(p + '/'));
    }
    if (role === 'inventory_manager') {
      return inventoryPaths.some((p) => path === p || path.startsWith(p + '/'));
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isDemo, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
