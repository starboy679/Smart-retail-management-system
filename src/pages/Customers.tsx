import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Search, X, Edit3, Trash2, Receipt, Phone, User, Save,
  ArrowRight, Calendar, Eye
} from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/Toast';

interface Customer {
  id: number;
  name: string;
  phone: string;
  created_at: string;
}

interface SaleRecord {
  id: number;
  invoice_number: string;
  total: number;
  created_at: string;
}

export default function Customers() {
  const navigate = useNavigate();
  const { toasts, show, remove } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [showSales, setShowSales] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = useState<SaleRecord[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res || []);
    } catch (e) {
      console.log('API not connected, using demo data');
      setCustomers([
        { id: 1, name: 'شركة النيل أوتو', phone: '01098765432', created_at: new Date().toISOString() },
        { id: 2, name: 'ورشة أحمد', phone: '01122334455', created_at: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = customers.filter((c) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return c.name.toLowerCase().includes(term) || c.phone?.toLowerCase().includes(term);
  });

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/customers/${editingId}`, form);
        show('تم تحديث العميل', 'success');
      } else {
        const res = await api.post('/customers', form);
        setCustomers([{ id: res.id, ...form, created_at: new Date().toISOString() }, ...customers]);
        show('تم إضافة العميل', 'success');
      }
      setShowModal(false);
      setForm({ name: '', phone: '' });
      setEditingId(null);
      fetchData();
    } catch (e) {
      show('حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل تريد حذف هذا العميل؟')) return;
    try {
      await api.delete(`/customers/${id}`);
      setCustomers(customers.filter((c) => c.id !== id));
      show('تم حذف العميل', 'success');
    } catch (e) {
      show('حدث خطأ أثناء الحذف', 'error');
    }
  };

  const openEdit = (c: Customer) => {
    setForm({ name: c.name, phone: c.phone || '' });
    setEditingId(c.id);
    setShowModal(true);
  };

  const openAdd = () => {
    setForm({ name: '', phone: '' });
    setEditingId(null);
    setShowModal(true);
  };

  const viewSales = async (c: Customer) => {
    setSelectedCustomer(c);
    try {
      const res = await api.get(`/customers/${c.id}/sales`);
      setCustomerSales(res || []);
    } catch (e) {
      setCustomerSales([]);
    }
    setShowSales(true);
  };

  return (
    <div className="customers-page">
      <ToastContainer toasts={toasts} onRemove={remove} />

      <div className="page-header">
        <div>
          <h2>العملاء</h2>
          <p>إدارة بيانات العملاء</p>
        </div>
        <div className="toolbar-actions">
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={16} /> عميل جديد
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو الهاتف..." />
          {search && <button onClick={() => setSearch('')}><X size={13} /></button>}
        </div>
      </div>

      {loading ? (
        <div className="loading-bar"><i /></div>
      ) : (
        <div className="customers-list">
          {filtered.length === 0 ? (
            <div className="empty-state">لا يوجد عملاء</div>
          ) : (
            filtered.map((c) => (
              <div className="customer-card" key={c.id}>
                <div className="customer-card-body">
                  <div className="customer-info">
                    <div className="customer-avatar"><User size={20} /></div>
                    <div>
                      <div className="customer-name">{c.name}</div>
                      {c.phone && <div className="customer-phone"><Phone size={12} /> {c.phone}</div>}
                      <div className="customer-date"><Calendar size={12} /> {new Date(c.created_at).toLocaleDateString('ar-EG')}</div>
                    </div>
                  </div>
                  <div className="customer-actions">
                    <button className="customer-action-btn" title="مشتريات العميل" onClick={() => viewSales(c)}>
                      <Eye size={14} />
                    </button>
                    <button className="customer-action-btn" title="تعديل" onClick={() => openEdit(c)}>
                      <Edit3 size={14} />
                    </button>
                    <button className="customer-action-btn delete" title="حذف" onClick={() => handleDelete(c.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'تعديل العميل' : 'عميل جديد'}</h3>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-field full">
                  <label>الاسم <span className="required">*</span></label>
                  <div className="input-icon"><User size={14} /><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اسم العميل" /></div>
                </div>
                <div className="form-field full">
                  <label>الهاتف</label>
                  <div className="input-icon"><Phone size={14} /><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="رقم الهاتف" /></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
              <button className="btn-primary" disabled={!form.name.trim() || saving} onClick={handleSave}>
                {saving ? 'جاري الحفظ...' : <><Save size={16} /> حفظ</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sales History Modal */}
      {showSales && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowSales(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>مشتريات {selectedCustomer.name}</h3>
              <button onClick={() => setShowSales(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {customerSales.length === 0 ? (
                <div className="empty-state" style={{ padding: 32 }}>لا توجد مشتريات مسجلة</div>
              ) : (
                <div className="customer-sales-list">
                  {customerSales.map((s) => (
                    <div className="customer-sale-row" key={s.id} onClick={() => navigate(`/invoice/${s.id}`)}>
                      <div className="customer-sale-info">
                        <Receipt size={14} />
                        <span className="customer-sale-number">{s.invoice_number}</span>
                      </div>
                      <div className="customer-sale-meta">
                        <span>{new Date(s.created_at).toLocaleDateString('ar-EG')}</span>
                        <strong>{Number(s.total).toLocaleString()} ج.س</strong>
                      </div>
                      <ArrowRight size={14} className="customer-sale-arrow" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowSales(false)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
