import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, ArrowRight, Search, Calendar, Eye, ShoppingCart } from 'lucide-react';
import api from '../api/axios';

interface Sale {
  id: number;
  invoice_number: string;
  customer_name: string;
  total: number;
  created_at: string;
  user_name: string;
}

export default function Sales() {
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/sales');
      setSales(res || []);
    } catch (e) {
      console.log('API not connected, using demo data');
      setSales([
        { id: 1, invoice_number: 'INV-20250812-101530-123', customer_name: 'شركة النيل أوتو', total: 3600, created_at: new Date().toISOString(), user_name: 'أحمد مصطفى' },
        { id: 2, invoice_number: 'INV-20250812-111200-456', customer_name: null, total: 180, created_at: new Date().toISOString(), user_name: 'أحمد مصطفى' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = sales.filter((s) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      s.invoice_number?.toLowerCase().includes(term) ||
      s.customer_name?.toLowerCase().includes(term) ||
      s.user_name?.toLowerCase().includes(term)
    );
  });

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const totalSales = sales.length;

  return (
    <div className="sales-page">
      <div className="page-header">
        <div>
          <h2>سجل المبيعات</h2>
          <p>جميع الفواتير والعمليات المسجلة</p>
        </div>
        <div className="toolbar-actions">
          <button className="btn-primary" onClick={() => navigate('/pos')}>
            <ShoppingCart size={16} /> بيع جديد
          </button>
        </div>
      </div>

      <div className="sales-kpis">
        <div className="inv-kpi">
          <div className="inv-kpi-icon blue"><Receipt size={18} /></div>
          <div>
            <span>إجمالي المبيعات</span>
            <strong>{totalSales}</strong>
          </div>
        </div>
        <div className="inv-kpi">
          <div className="inv-kpi-icon cyan"><Receipt size={18} /></div>
          <div>
            <span>إجمالي الإيرادات</span>
            <strong>{totalRevenue.toLocaleString()} ج.س</strong>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث برقم الفاتورة أو العميل..." />
          {search && <button onClick={() => setSearch('')}><Search size={13} /></button>}
        </div>
      </div>

      {loading ? (
        <div className="loading-bar"><i /></div>
      ) : (
        <div className="sales-list">
          {filtered.length === 0 ? (
            <div className="empty-state">لا توجد مبيعات مسجلة</div>
          ) : (
            filtered.map((s) => (
              <div className="sale-card" key={s.id} onClick={() => navigate(`/invoice/${s.id}`)}>
                <div className="sale-card-header">
                  <div className="sale-card-id">
                    <Receipt size={16} />
                    <span>{s.invoice_number}</span>
                  </div>
                </div>
                <div className="sale-card-body">
                  <div className="sale-card-info">
                    <div className="sale-card-customer">{s.customer_name || 'عميل نقدي'}</div>
                    <div className="sale-card-date">
                      <Calendar size={12} />
                      {new Date(s.created_at).toLocaleString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="sale-card-total">
                    <strong>{Number(s.total).toLocaleString()} ج.س</strong>
                  </div>
                </div>
                <div className="sale-card-footer">
                  <span><ArrowRight size={12} /> {s.user_name || 'مستخدم'}</span>
                  <button className="sale-view-btn"><Eye size={14} /> عرض الفاتورة</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
