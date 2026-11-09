import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, Eye, EyeOff, Lock, Mail, Server } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@falcon.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDemoMode(false);
    try {
      await login(email, password);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || '';
      if (email === 'admin@falcon.com' && password === 'admin123') {
        setDemoMode(true);
      } else {
        setError(msg || 'خطأ في تسجيل الدخول');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" dir="rtl">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark"><img src="/logo.svg" alt="A&A" /></div>
          
        </div>
        <h2>تسجيل الدخول</h2>
        <p>أدخل بيانات حسابك للوصول إلى النظام</p>
        {demoMode && (
          <div className="demo-banner">
            <Server size={16} />
            <span>السيرفر غير متصل. يتم التشغيل في وضع العرض التجريبي.</span>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <Mail size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              required
            />
          </div>
          <div className="input-group">
            <Lock size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
        <div className="login-hint">
          <strong>بيانات الدخول التجريبية:</strong>
          <span>admin@falcon.com / admin123</span>
        </div>
      </div>
    </div>
  );
}
