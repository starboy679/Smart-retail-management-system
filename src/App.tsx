import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, LogOut, Menu, Settings, ShoppingBag, ShoppingCart, Users, Warehouse, X, Zap, Download
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Purchases from './pages/Purchases';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import Invoice from './pages/Invoice';
import Sales from './pages/Sales';

type IconType = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

const allMenuItems: [string, string, IconType, string[]][] = [
  ['الرئيسية', '/', LayoutDashboard, ['admin']],
  ['نقطة البيع', '/pos', ShoppingCart, ['admin', 'cashier']],
  ['المنتجات', '/products', Warehouse, ['admin', 'cashier', 'inventory_manager']],
  ['المخزون', '/inventory', Warehouse, ['admin', 'inventory_manager']],
  ['المشتريات', '/purchases', ShoppingBag, ['admin', 'inventory_manager']],
  ['العملاء', '/customers', Users, ['admin', 'cashier']],
  ['التقارير', '/reports', LayoutDashboard, ['admin']],
  ['الإعدادات', '/settings', Settings, ['admin']],
];

function RequireRole({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user, canAccess } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role) || !canAccess(location.pathname)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function Layout() {
  const { user, logout, isDemo } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activePath = location.pathname;

  const menuItems = allMenuItems.filter(([, , , roles]) => roles.includes(user?.role || ''));

  return (
    <div className="app-shell" dir="rtl">
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><img src="/logo.svg" alt="A&A" /></div>
          <div><strong>A&A</strong><span> لقطع غيار السيارات </span></div>
        </div>
        <nav>
          {menuItems.map(([name, path, Icon]) => (
            <Link
              key={name}
              to={path}
              className={activePath === path ? 'active' : ''}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Icon size={19} />
              <span>{name}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="side-user">
            <div className="avatar">{user?.name?.charAt(0) || 'أ'}</div>
            <div>
              <b>{user?.name || 'أحمد مصطفى'}</b>
              <span>{user?.role === 'admin' ? 'مدير النظام' : user?.role === 'cashier' ? 'كاشير' : 'مدير المخزون'}</span>
            </div>
            <button onClick={logout} title="تسجيل الخروج"><LogOut size={17} /></button>
          </div>
          

        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="topbar-title">
            <h1>{menuItems.find(([, p]) => p === activePath)?.[0] || 'A&A'}</h1>
          </div>
          <div className="top-actions">
            {isDemo && <span className="demo-badge">وضع تجريبي</span>}
            <div className="profile">
              <div className="avatar">{user?.name?.charAt(0) || 'أ'}</div>
              <div>
                <b>{user?.name || 'أحمد مصطفى'}</b>
                <span>{user?.role === 'admin' ? 'مدير النظام' : user?.role === 'cashier' ? 'كاشير' : 'مدير المخزون'}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="content">
          {isDemo && (
            <div className="api-banner">
              <span>⚠️</span> النظام يعمل بوضع العرض التجريبي. لتفعيل قاعدة البيانات شغل السيرفر المحلي.
            </div>
          )}
          <Routes>
            <Route path="/" element={<RequireRole roles={['admin']}><Dashboard /></RequireRole>} />
            <Route path="/pos" element={<RequireRole roles={['admin', 'cashier']}><POS /></RequireRole>} />
            <Route path="/sales" element={<RequireRole roles={['admin', 'cashier']}><Sales /></RequireRole>} />
            <Route path="/invoice/:id" element={<RequireRole roles={['admin', 'cashier', 'inventory_manager']}><Invoice /></RequireRole>} />
            <Route path="/products" element={<RequireRole roles={['admin', 'cashier', 'inventory_manager']}><Products /></RequireRole>} />
            <Route path="/inventory" element={<RequireRole roles={['admin', 'inventory_manager']}><Inventory /></RequireRole>} />
            <Route path="/purchases" element={<RequireRole roles={['admin', 'inventory_manager']}><Purchases /></RequireRole>} />
            <Route path="/customers" element={<RequireRole roles={['admin', 'cashier']}><Customers /></RequireRole>} />
            <Route path="/reports" element={<RequireRole roles={['admin']}><Reports /></RequireRole>} />
            <Route path="/settings" element={<RequireRole roles={['admin']}><SettingsPage /></RequireRole>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  const { token, loading } = useAuth();

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!token) return <Login />;

  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
