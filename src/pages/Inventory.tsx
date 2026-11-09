import { useState, useEffect, useCallback } from 'react';
import {
  Warehouse, Search, X, AlertTriangle, CheckCircle, Package,
  ArrowUpCircle, TrendingDown
} from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/Toast';

interface Product {
  id: number;
  category_name: string;
  name: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  minimum_stock: number;
}

export default function Inventory() {
  const { toasts, show, remove } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out' | 'ok'>('all');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/inventory');
      setProducts(res || []);
    } catch (e) {
      console.log('API not connected, using demo data');
      setProducts([
        { id: 1, category_name: 'قطع المحرك', name: 'فلتر زيت تويوتا', sku: 'FLT-001', purchase_price: 120, selling_price: 180, quantity: 3, minimum_stock: 5 },
        { id: 2, category_name: 'نظام الفرامل', name: 'تيل فرامل بوش', sku: 'BRK-002', purchase_price: 85, selling_price: 140, quantity: 45, minimum_stock: 10 },
        { id: 3, category_name: 'الكهرباء', name: 'بوجيهات NGK', sku: 'SPK-003', purchase_price: 35, selling_price: 65, quantity: 120, minimum_stock: 20 },
        { id: 4, category_name: 'قطع المحرك', name: 'سير كاتينة كيا', sku: 'BEL-004', purchase_price: 220, selling_price: 380, quantity: 0, minimum_stock: 8 },
        { id: 5, category_name: 'أخرى', name: 'فلتر هواء', sku: 'AIR-005', purchase_price: 45, selling_price: 85, quantity: 65, minimum_stock: 15 },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stockStatus = (p: Product) => {
    if (p.quantity === 0) return { label: 'نفد المخزون', tone: 'danger' as const, icon: <AlertTriangle size={14} /> };
    if (p.quantity <= p.minimum_stock) return { label: 'مخزون منخفض', tone: 'warning' as const, icon: <TrendingDown size={14} /> };
    return { label: 'متوفر', tone: 'success' as const, icon: <CheckCircle size={14} /> };
  };

  const stockProgress = (p: Product) => {
    if (p.minimum_stock === 0) return 100;
    const pct = (p.quantity / (p.minimum_stock * 3)) * 100;
    return Math.min(Math.max(pct, 0), 100);
  };

  const filtered = products.filter((p) => {
    const term = search.toLowerCase().trim();
    const matchSearch = !term || p.name.toLowerCase().includes(term) || p.id.toLowerCase().includes(term);
    const status = stockStatus(p);
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'out' && status.tone === 'danger') ||
      (filterStatus === 'low' && status.tone === 'warning') ||
      (filterStatus === 'ok' && status.tone === 'success');
    return matchSearch && matchStatus;
  });

  const totalProducts = products.length;
  const lowCount = products.filter((p) => stockStatus(p).tone === 'warning').length;
  const outCount = products.filter((p) => stockStatus(p).tone === 'danger').length;
  const totalValue = products.reduce((sum, p) => sum + p.quantity * p.purchase_price, 0);

  return (
    <div className="inventory-page">
      <ToastContainer toasts={toasts} onRemove={remove} />

      <div className="page-header">
        <h2>المخزون</h2>
        <p>مراقبة المخزون والكميات</p>
      </div>

      <div className="inventory-kpis">
        <div className="inv-kpi">
          <div className="inv-kpi-icon blue"><Package size={20} /></div>
          <div><span>إجمالي المنتجات</span><strong>{totalProducts}</strong></div>
        </div>
        <div className="inv-kpi">
          <div className="inv-kpi-icon orange"><TrendingDown size={20} /></div>
          <div><span>مخزون منخفض</span><strong>{lowCount}</strong></div>
        </div>
        <div className="inv-kpi">
          <div className="inv-kpi-icon red"><AlertTriangle size={20} /></div>
          <div><span>نفد المخزون</span><strong>{outCount}</strong></div>
        </div>
        <div className="inv-kpi">
          <div className="inv-kpi-icon green"><ArrowUpCircle size={20} /></div>
          <div><span>قيمة المخزون</span><strong>{totalValue.toLocaleString()} ج.س</strong></div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالاسم أو رقم المنتج" />
          {search && <button onClick={() => setSearch('')}><X size={14} /></button>}
        </div>
        <div className="filter-pills">
          <button className={filterStatus === 'all' ? 'active' : ''} onClick={() => setFilterStatus('all')}>الكل</button>
          <button className={filterStatus === 'ok' ? 'active' : ''} onClick={() => setFilterStatus('ok')}>متوفر</button>
          <button className={filterStatus === 'low' ? 'active' : ''} onClick={() => setFilterStatus('low')}>منخفض</button>
          <button className={filterStatus === 'out' ? 'active' : ''} onClick={() => setFilterStatus('out')}>نفد</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-bar"><i /></div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table inventory-table">
            <thead>
              <tr>
                <th>المنتج</th>
                <th>رقم المنتج</th>
                <th>التصنيف</th>
                <th>الكمية</th>
                <th>الحد الأدنى</th>
                <th>الحالة</th>
                <th>سعر الشراء</th>
                <th>سعر البيع</th>
                <th>المخزون</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="empty-cell">لا توجد منتجات</td></tr>
              ) : (
                filtered.map((p) => {
                  const status = stockStatus(p);
                  const prog = stockProgress(p);
                  return (
                    <tr key={p.id} className={status.tone === 'danger' ? 'row-danger' : status.tone === 'warning' ? 'row-warning' : ''}>
                      <td>
                        <div className="cell-product">
                          <div className={`status-dot ${status.tone}`} />
                          <span>{p.name}</span>
                        </div>
                      </td>
                      <td className="cell-mono">{p.id}</td>
                      <td><span className="cat-badge">{p.category_name || '-'}</span></td>
                      <td><strong>{p.quantity}</strong></td>
                      <td>{p.minimum_stock}</td>
                      <td>
                        <span className={`status-badge ${status.tone}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td>{p.purchase_price.toLocaleString()} ج.س</td>
                      <td>{p.selling_price.toLocaleString()} ج.س</td>
                      <td>
                        <div className="stock-bar">
                          <div className="stock-bar-track">
                            <div className={`stock-bar-fill ${status.tone}`} style={{ width: `${prog}%` }} />
                          </div>
                          <span>{prog.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <div className="table-footer">
            <span>إجمالي: {filtered.length} منتج</span>
          </div>
        </div>
      )}
    </div>
  );
}
