import { useState, useEffect, useCallback } from 'react';
import {
  Boxes, Plus, Search, X, Edit3, Trash2, ChevronDown, Tag, Package,
  DollarSign, Hash, AlertTriangle, CheckCircle, Save, Loader2
} from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/Toast';

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  category_id: number | null;
  category_name: string;
  name: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  minimum_stock: number;
}

const emptyProduct: Omit<Product, 'id' | 'category_name'> = {
  category_id: null,
  name: '',
  purchase_price: 0,
  selling_price: 0,
  quantity: 0,
  minimum_stock: 5,
};

export default function Products() {
  const { toasts, show, remove } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryError, setCategoryError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
      ]);
      setProducts(prodRes || []);
      setCategories(catRes || []);
    } catch (e) {
      console.error('Failed to connect to API', e);
      setProducts([]);
      setCategories([]);
    } 
      finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = products.filter((p) => {
    const term = search.toLowerCase().trim();
    const matchSearch = !term || p.name.toLowerCase().includes(term) || String(p.id).includes(term);
    const matchCategory = filterCategory === '' || p.category_id === filterCategory;
    return matchSearch && matchCategory;
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'اسم المنتج مطلوب';
    if (form.purchase_price < 0) errors.purchase_price = 'السعر غير صالح';
    if (form.selling_price < 0) errors.selling_price = 'السعر غير صالح';
    if (form.quantity < 0) errors.quantity = 'الكمية غير صالحة';
    if (form.minimum_stock < 0) errors.minimum_stock = 'غير صالح';
    if (form.selling_price < form.purchase_price) {
      errors.selling_price = 'سعر البيع يجب أن يكون أعلى من سعر الشراء';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAdd = () => {
    setEditingProduct(null);
    setForm(emptyProduct);
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      category_id: p.category_id,
      name: p.name,
      purchase_price: p.purchase_price,
      selling_price: p.selling_price,
      quantity: p.quantity,
      minimum_stock: p.minimum_stock,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, form);
        show('تم تعديل المنتج بنجاح', 'success');
      } else {
        await api.post('/products', form);
        show('تم إضافة المنتج بنجاح', 'success');
      }
      setShowModal(false);
      fetchData();
    } catch (e: any) {
      show(e?.error || 'حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/products/${id}`);
      setDeleteConfirm(null);
      show('تم حذف المنتج بنجاح', 'success');
      fetchData();
    } catch (e: any) {
      show(e?.error || 'حدث خطأ أثناء الحذف', 'error');
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      setCategoryError('اسم التصنيف مطلوب');
      return;
    }
    setCategoryError('');
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, { name: categoryForm.name.trim() });
        show('تم تعديل التصنيف بنجاح', 'success');
      } else {
        await api.post('/categories', { name: categoryForm.name.trim() });
        show('تم إضافة التصنيف بنجاح', 'success');
      }
      setShowCategoryModal(false);
      setCategoryForm({ name: '' });
      setEditingCategory(null);
      fetchData();
    } catch (e: any) {
      show(e?.error || 'حدث خطأ', 'error');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    const hasProducts = products.some((p) => p.category_id === id);
    if (hasProducts) {
      show('لا يمكن حذف التصنيف لوجود منتجات مرتبطة به', 'error');
      return;
    }
    try {
      await api.delete(`/categories/${id}`);
      show('تم حذف التصنيف بنجاح', 'success');
      fetchData();
    } catch (e: any) {
      show(e?.error || 'حدث خطأ أثناء الحذف', 'error');
    }
  };

  const stockStatus = (p: Product) => {
    if (p.quantity === 0) return { label: 'نفد المخزون', tone: 'danger' as const };
    if (p.quantity <= p.minimum_stock) return { label: 'مخزون منخفض', tone: 'warning' as const };
    return { label: 'متوفر', tone: 'success' as const };
  };

  return (
    <div className="products-page">
      <ToastContainer toasts={toasts} onRemove={remove} />

      <div className="page-header">
        <h2>المنتجات</h2>
        <p>إدارة قطع الغيار والمنتجات</p>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو رقم المنتج..."
          />
          {search && <button onClick={() => setSearch('')}><X size={14} /></button>}
        </div>
        <div className="filter-select">
          <ChevronDown size={14} />
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value === '' ? '' : Number(e.target.value))}>
            <option value="">كل التصنيفات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-secondary" onClick={() => { setShowCategoryModal(true); setCategoryError(''); setCategoryForm({ name: '' }); setEditingCategory(null); }}>
            <Tag size={16} /> التصنيفات
          </button>
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={16} /> إضافة منتج
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-bar"><i /></div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>المنتج</th>
                <th>رقم المنتج</th>
                <th>التصنيف</th>
                <th>سعر الشراء</th>
                <th>سعر البيع</th>
                <th>الكمية</th>
                <th>الحد الأدنى</th>
                <th>الحالة</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="empty-cell">لا توجد منتجات</td></tr>
              ) : (
                filtered.map((p) => {
                  const status = stockStatus(p);
                  return (
                    <tr key={p.id}>
                      <td><div className="cell-product"><Package size={16} /><span>{p.name}</span></div></td>
                      <td className="cell-mono">{p.id}</td>
                      <td><span className="cat-badge">{p.category_name || '-'}</span></td>
                      <td>{p.purchase_price.toLocaleString()} ج.س</td>
                      <td>{p.selling_price.toLocaleString()} ج.س</td>
                      <td>{p.quantity}</td>
                      <td>{p.minimum_stock}</td>
                      <td>
                        <span className={`status-badge ${status.tone}`}>
                          {status.tone === 'success' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button onClick={() => openEdit(p)} title="تعديل"><Edit3 size={14} /></button>
                          <button onClick={() => setDeleteConfirm(p.id)} title="حذف"><Trash2 size={14} /></button>
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

      {/* Product Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}</h3>
              <button onClick={() => !saving && setShowModal(false)} disabled={saving}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-field full">
                  <label>اسم المنتج <span className="required">*</span></label>
                  <input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setFormErrors((prev) => ({ ...prev, name: '' })); }} placeholder="مثال: فلتر زيت تويوتا" className={formErrors.name ? 'input-error' : ''} />
                  {formErrors.name && <span className="error-text">{formErrors.name}</span>}
                </div>
                
                <div className="form-field">
                  <label>التصنيف</label>
                  <div className="input-icon"><Tag size={14} />
                    <select value={form.category_id} onChange={(e) => { setForm({ ...form, category_id: e.target.value ? Number(e.target.value) : null });
                      setFormErrors((prev) => ({ ...prev, category_id: '' })); }}
                      className={formErrors.category_id ? 'input-error' : ''}>
                      <option value="">اختر التصنيف</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  {formErrors.category_id && <span className="error-text">{formErrors.category_id}</span>}
                </div>
                <div className="form-field">
                  <label>سعر الشراء</label>
                  <div className="input-icon"><DollarSign size={14} /><input type="number" min={0} value={form.purchase_price} onChange={(e) => { setForm({ ...form, purchase_price: Number(e.target.value) }); setFormErrors((prev) => ({ ...prev, purchase_price: '' })); }} className={formErrors.purchase_price ? 'input-error' : ''} /></div>
                  {formErrors.purchase_price && <span className="error-text">{formErrors.purchase_price}</span>}
                </div>
                <div className="form-field">
                  <label>سعر البيع</label>
                  <div className="input-icon"><DollarSign size={14} /><input type="number" min={0} value={form.selling_price} onChange={(e) => { setForm({ ...form, selling_price: Number(e.target.value) }); setFormErrors((prev) => ({ ...prev, selling_price: '' })); }} className={formErrors.selling_price ? 'input-error' : ''} /></div>
                  {formErrors.selling_price && <span className="error-text">{formErrors.selling_price}</span>}
                </div>
                <div className="form-field">
                  <label>الكمية</label>
                  <div className="input-icon"><Boxes size={14} /><input type="number" min={0} value={form.quantity} onChange={(e) => { setForm({ ...form, quantity: Number(e.target.value) }); setFormErrors((prev) => ({ ...prev, quantity: '' })); }} className={formErrors.quantity ? 'input-error' : ''} /></div>
                  {formErrors.quantity && <span className="error-text">{formErrors.quantity}</span>}
                </div>
                <div className="form-field">
                  <label>الحد الأدنى</label>
                  <div className="input-icon"><AlertTriangle size={14} /><input type="number" min={0} value={form.minimum_stock} onChange={(e) => { setForm({ ...form, minimum_stock: Number(e.target.value) }); setFormErrors((prev) => ({ ...prev, minimum_stock: '' })); }} className={formErrors.minimum_stock ? 'input-error' : ''} /></div>
                  {formErrors.minimum_stock && <span className="error-text">{formErrors.minimum_stock}</span>}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>إلغاء</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>إدارة التصنيفات</h3>
              <button onClick={() => setShowCategoryModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="category-list">
                {categories.map((c) => (
                  <div className="category-item" key={c.id}>
                    <span>{c.name}</span>
                    <div className="row-actions">
                      <button onClick={() => { setEditingCategory(c); setCategoryForm({ name: c.name }); setCategoryError(''); }} title="تعديل"><Edit3 size={13} /></button>
                      <button onClick={() => handleDeleteCategory(c.id)} title="حذف"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && <div className="empty-cell">لا توجد تصنيفات</div>}
              </div>
              <div className="form-field mt-12">
                <label>{editingCategory ? 'تعديل تصنيف' : 'تصنيف جديد'}</label>
                <input
                  value={categoryForm.name}
                  onChange={(e) => { setCategoryForm({ name: e.target.value }); setCategoryError(''); }}
                  placeholder="اسم التصنيف"
                  className={categoryError ? 'input-error' : ''}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveCategory()}
                />
                {categoryError && <span className="error-text">{categoryError}</span>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => { setShowCategoryModal(false); setEditingCategory(null); setCategoryForm({ name: '' }); setCategoryError(''); }}>إلغاء</button>
              <button className="btn-primary" onClick={handleSaveCategory}>
                {editingCategory ? 'حفظ التعديل' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body text-center">
              <AlertTriangle size={36} style={{ color: '#ef4444', marginBottom: 12 }} />
              <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>تأكيد الحذف</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: 12 }}>هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>إلغاء</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteConfirm)}>حذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
