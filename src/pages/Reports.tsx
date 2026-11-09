import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileBarChart, TrendingUp, ShoppingCart, ShoppingBag, Receipt,
  AlertTriangle, Calendar, ArrowRight, Eye,
  Package, DollarSign, Loader2
} from 'lucide-react';
import api from '../api/axios';

type Tab = 'sales' | 'purchases' | 'profit' | 'lowstock';

interface DateRange {
  from: string;
  to: string;
}

interface ReportSale {
  id: number;
  invoice_number: string;
  customer_name: string;
  total: number;
  created_at: string;
  user_name: string;
}

interface ReportPurchase {
  id: number;
  invoice_number: string;
  total: number;
  currency: string;
  created_at: string;
  user_name: string;
}

interface ProductLow {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  minimum_stock: number;
  category_name: string;
}

export default function Reports() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('sales');
  const [filter, setFilter] = useState('today');
  const [customRange, setCustomRange] = useState<DateRange>({ from: '', to: '' });
  const [showCustom, setShowCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data states
  const [salesData, setSalesData] = useState({ rows: [] as ReportSale[], total: 0, count: 0 });
  const [purchasesData, setPurchasesData] = useState({ rows: [] as ReportPurchase[], total: 0, count: 0 });
  const [profitData, setProfitData] = useState({ totalRevenue: 0, totalCost: 0, profit: 0, salesCount: 0 });
  const [lowStockData, setLowStockData] = useState<ProductLow[]>([]);

  const today = new Date().toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = showCustom && customRange.from && customRange.to
        ? { from: customRange.from, to: customRange.to }
        : { filter };

      if (tab === 'sales') {
        const res = await api.get('/reports/sales', { params });
        setSalesData(res || { rows: [], total: 0, count: 0 });
      } else if (tab === 'purchases') {
        const res = await api.get('/reports/purchases', { params });
        setPurchasesData(res || { rows: [], total: 0, count: 0 });
      } else if (tab === 'profit') {
        const res = await api.get('/reports/profit', { params });
        setProfitData(res || { totalRevenue: 0, totalCost: 0, profit: 0, salesCount: 0 });
      } else if (tab === 'lowstock') {
        const res = await api.get('/reports/low-stock');
        setLowStockData(res || []);
      }
    } catch (e) {
      setError('لا يمكن الاتصال بالخادم، جارٍ استخدام البيانات التجريبية');
      // Demo data fallback
      if (tab === 'sales') {
        setSalesData({ rows: [
          { id: 1, invoice_number: 'INV-250820-101530-123', customer_name: 'شركة النيل', total: 1850, created_at: new Date().toISOString(), user_name: 'أحمد' },
        ], total: 1850, count: 1 });
      } else if (tab === 'purchases') {
        setPurchasesData({ rows: [
          { id: 1, invoice_number: 'PRC-250820-120001-001', total: 35000, currency: 'SDG', created_at: new Date().toISOString(), user_name: 'أحمد' },
        ], total: 35000, count: 1 });
      } else if (tab === 'profit') {
        setProfitData({ totalRevenue: 2000, totalCost: 1200, profit: 800, salesCount: 1 });
      } else if (tab === 'lowstock') {
        setLowStockData([
          { id: 1, name: 'فلتر زيت تويوتا', sku: 'FLT-001', quantity: 3, minimum_stock: 5, category_name: 'قطع المحرك' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, [tab, filter, showCustom, customRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilter = (f: string) => {
    setFilter(f);
    if (f === 'custom') {
      setShowCustom(true);
      setCustomRange({ from: today, to: today });
    } else {
      setShowCustom(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { key: 'sales', label: 'المبيعات', icon: ShoppingCart },
    { key: 'purchases', label: 'المشتريات', icon: ShoppingBag },
    { key: 'profit', label: 'الربح', icon: TrendingUp },
    { key: 'lowstock', label: 'مخزون منخفض', icon: AlertTriangle },
  ];

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h2>التقارير</h2>
          <p>ملخص المبيعات والمشتريات والأرباح</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="reports-tabs">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Date Filters */}
      <div className="reports-filters">
        <div className="filter-pills">
          {[
            { key: 'today', label: 'اليوم' },
            { key: 'week', label: 'هذا الأسبوع' },
            { key: 'month', label: 'هذا الشهر' },
            { key: 'custom', label: 'تاريخ مخصص' },
          ].map((f) => (
            <button key={f.key} className={filter === f.key ? 'active' : ''} onClick={() => handleFilter(f.key)}>
              <Calendar size={12} /> {f.label}
            </button>
          ))}
        </div>
        {showCustom && (
          <div className="reports-custom-range">
            <input type="date" value={customRange.from} onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })} />
            <span>إلى</span>
            <input type="date" value={customRange.to} onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })} />
            <button className="btn-primary" onClick={fetchData} disabled={!customRange.from || !customRange.to}>
              عرض
            </button>
          </div>
        )}
      </div>

      {loading && <div className="loading-bar"><i /></div>}

      {tab === 'sales' && (
        <div className="reports-section">
          <div className="reports-kpis">
            <div className="inv-kpi">
              <div className="inv-kpi-icon blue"><Receipt size={18} /></div>
              <div><span>عدد المبيعات</span><strong>{salesData.count}</strong></div>
            </div>
            <div className="inv-kpi">
              <div className="inv-kpi-icon cyan"><DollarSign size={18} /></div>
              <div><span>الإجمالي</span><strong>{salesData.total.toLocaleString()} ج.س</strong></div>
            </div>
          </div>
          <div className="reports-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>الفاتورة</th><th>العميل</th><th>الإجمالي</th><th>التاريخ</th><th></th></tr>
              </thead>
              <tbody>
                {salesData.rows.length === 0 ? (
                  <tr><td colSpan={5} className="empty-cell">لا توجد مبيعات</td></tr>
                ) : (
                  salesData.rows.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontFamily: 'monospace', direction: 'ltr' }}>{s.invoice_number}</td>
                      <td>{s.customer_name || 'عميل نقدي'}</td>
                      <td><strong>{Number(s.total).toLocaleString()} ج.س</strong></td>
                      <td>{new Date(s.created_at).toLocaleDateString('ar-EG')}</td>
                      <td><button className="table-action-btn" onClick={() => navigate(`/invoice/${s.id}`)}><Eye size={14} /></button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'purchases' && (
        <div className="reports-section">
          <div className="reports-kpis">
            <div className="inv-kpi">
              <div className="inv-kpi-icon blue"><ShoppingBag size={18} /></div>
              <div><span>عدد المشتريات</span><strong>{purchasesData.count}</strong></div>
            </div>
            <div className="inv-kpi">
              <div className="inv-kpi-icon green"><DollarSign size={18} /></div>
              <div><span>الإجمالي</span><strong>{purchasesData.total.toLocaleString()} ج.س</strong></div>
            </div>
          </div>
          <div className="reports-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>رقم المخزون</th><th>الإجمالي</th><th>العملة</th><th>التاريخ</th><th></th></tr>
              </thead>
              <tbody>
                {purchasesData.rows.length === 0 ? (
                  <tr><td colSpan={5} className="empty-cell">لا توجد مشتريات</td></tr>
                ) : (
                  purchasesData.rows.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'monospace', direction: 'ltr' }}>{p.invoice_number}</td>
                      <td><strong>{Number(p.total).toLocaleString()} ج.س</strong></td>
                      <td><span className={`purchase-currency ${p.currency || 'SDG'}`}>{p.currency || 'SDG'}</span></td>
                      <td>{new Date(p.created_at).toLocaleDateString('ar-EG')}</td>
                      <td><button className="table-action-btn" onClick={() => navigate(`/invoice/${p.id}?type=purchase`)}><Eye size={14} /></button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'profit' && (
        <div className="reports-section">
          <div className="reports-kpis">
            <div className="inv-kpi">
              <div className="inv-kpi-icon blue"><TrendingUp size={18} /></div>
              <div><span>عدد المبيعات</span><strong>{profitData.salesCount}</strong></div>
            </div>
            <div className="inv-kpi">
              <div className="inv-kpi-icon violet"><Receipt size={18} /></div>
              <div><span>الإيرادات</span><strong>{profitData.totalRevenue.toLocaleString()} ج.س</strong></div>
            </div>
            <div className="inv-kpi">
              <div className="inv-kpi-icon red"><Package size={18} /></div>
              <div><span>تكلفة البضاعة</span><strong>{profitData.totalCost.toLocaleString()} ج.س</strong></div>
            </div>
            <div className="inv-kpi">
              <div className="inv-kpi-icon green"><DollarSign size={18} /></div>
              <div><span>الربح الصافي</span><strong style={{ color: profitData.profit >= 0 ? '#16a34a' : '#ef4444' }}>{profitData.profit.toLocaleString()} ج.س</strong></div>
            </div>
          </div>
          <div className="profit-chart-bar">
            <div className="profit-bar-labels">
              <span>الإيرادات: {profitData.totalRevenue.toLocaleString()} ج.س</span>
              <span>التكلفة: {profitData.totalCost.toLocaleString()} ج.س</span>
              <span>الربح: {profitData.profit.toLocaleString()} ج.س</span>
            </div>
            <div className="profit-bar-track">
              <div className="profit-bar-revenue" style={{ width: profitData.totalRevenue > 0 ? `${Math.min((profitData.totalRevenue / Math.max(profitData.totalRevenue, profitData.totalCost, Math.abs(profitData.profit))) * 100, 100)}%` : '0%' }} />
              <div className="profit-bar-cost" style={{ width: profitData.totalCost > 0 ? `${Math.min((profitData.totalCost / Math.max(profitData.totalRevenue, profitData.totalCost, Math.abs(profitData.profit))) * 100, 100)}%` : '0%' }} />
              <div className="profit-bar-profit" style={{ width: profitData.profit > 0 ? `${Math.min((profitData.profit / Math.max(profitData.totalRevenue, profitData.totalCost, profitData.profit)) * 100, 100)}%` : '0%' }} />
            </div>
          </div>
        </div>
      )}

      {tab === 'lowstock' && (
        <div className="reports-section">
          <div className="reports-kpis">
            <div className="inv-kpi">
              <div className="inv-kpi-icon red"><AlertTriangle size={18} /></div>
              <div><span>منتجات منخفضة</span><strong>{lowStockData.length}</strong></div>
            </div>
          </div>
          <div className="reports-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>المنتج</th><th>SKU</th><th>الفئة</th><th>الكمية</th><th>الحد الأدنى</th></tr>
              </thead>
              <tbody>
                {lowStockData.length === 0 ? (
                  <tr><td colSpan={5} className="empty-cell">لا توجد منتجات منخفضة</td></tr>
                ) : (
                  lowStockData.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td style={{ fontFamily: 'monospace', direction: 'ltr' }}>{p.sku}</td>
                      <td>{p.category_name || '-'}</td>
                      <td><span style={{ color: p.quantity === 0 ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>{p.quantity}</span></td>
                      <td>{p.minimum_stock}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
