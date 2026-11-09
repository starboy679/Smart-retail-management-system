import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, ShoppingBag, PackagePlus, LayoutDashboard,
  CircleDollarSign, ReceiptText, TriangleAlert, Clock3
} from 'lucide-react';
import api from '../api/axios';

interface Sale {
  id: number;
  total: number;
  customer_name: string;
  created_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [salesToday, setSalesToday] = useState('0 ج.س');
  const [salesCount, setSalesCount] = useState('0');
  const [lowStock, setLowStock] = useState('0');
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/dashboard/kpi');
        const d = res;
        setSalesToday(`${Number(d.sales_today || 0).toLocaleString()} ج.س`);
        setSalesCount(String(d.sales_count || 0));
        setLowStock(String(d.low_stock || 0));
        setRecentSales((d.recent_sales || []).slice(0, 5));
      } catch (e) {
        console.log('API not connected');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `${mins} دقيقة`;
    return `${Math.floor(mins / 60)} ساعة`;
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h2>الرئيسية</h2>
        <p>نظرة سريعة على أداء المحل اليوم</p>
      </div>

      {loading && <div className="loading-bar"><i /></div>}

      <div className="kpi-grid simple">
        <div className="kpi blue">
          <div className="kpi-icon"><CircleDollarSign size={22} /></div>
          <div><span>مبيعات اليوم</span><strong>{salesToday}</strong></div>
        </div>
        <div className="kpi violet">
          <div className="kpi-icon"><ReceiptText size={22} /></div>
          <div><span>عدد عمليات البيع</span><strong>{salesCount}</strong></div>
        </div>
        <div className="kpi orange">
          <div className="kpi-icon"><TriangleAlert size={22} /></div>
          <div><span>منتجات منخفضة</span><strong>{lowStock}</strong></div>
        </div>
      </div>

      <div className="quick-actions-row">
        <button className="btn-primary" onClick={() => navigate('/pos')}>
          <ShoppingCart size={18} /> بيع جديد
        </button>
        <button className="btn-secondary" onClick={() => navigate('/purchases')}>
          <ShoppingBag size={18} /> إضافة شراء
        </button>
        <button className="btn-secondary" onClick={() => navigate('/products')}>
          <PackagePlus size={18} /> إضافة منتج
        </button>
      </div>

      <div className="recent-sales card">
        <div className="section-title">
          <div><h2>آخر 5 عمليات بيع</h2><p>آخر المبيعات المسجلة</p></div>
          <LayoutDashboard size={18} />
        </div>
        {recentSales.length === 0 ? (
          <div className="empty-state">لا توجد مبيعات مسجلة اليوم</div>
        ) : (
          <div className="sale-list">
            {recentSales.map((s) => (
              <div className="sale-item" key={s.id}>
                <div className="sale-info">
                  <strong>فاتورة #{s.id}</strong>
                  <span>{s.customer_name || 'عميل نقدي'}</span>
                </div>
                <div className="sale-meta">
                  <b>{Number(s.total).toLocaleString()} ج.س</b>
                  <span><Clock3 size={12} /> {timeAgo(s.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
