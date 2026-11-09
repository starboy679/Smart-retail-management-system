import { useState, useEffect, useCallback } from 'react';
import {
  Settings, Coins, Plus, Search, X, Edit3, Trash2, ArrowRight, History,
  TrendingUp, Banknote, Tag, CheckCircle, AlertTriangle, User, Shield, Building2,
  Save, Users, Lock, Eye, EyeOff, KeyRound
} from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/Toast';

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  rate?: number;
  rate_updated?: string;
}

interface RateHistory {
  id: number;
  currency_id: number;
  rate: number;
  created_at: string;
}

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface ShopInfo {
  id: number;
  name: string;
  address: string;
  phone: string;
  tax_number: string;
}

type SettingsTab = 'shop' | 'users' | 'roles' | 'currencies';

const roleLabels: Record<string, string> = {
  admin: 'مدير النظام',
  cashier: 'كاشير',
  inventory_manager: 'مدير المخزون',
};

const rolePermissions: Record<string, { label: string; items: string[] }> = {
  admin: { label: 'مدير النظام', items: ['وصول كامل لجميع الأقسام', 'إدارة المستخدمين والأدوار', 'إدارة العملات وأسعار الصرف', 'عرض التقارير', 'إدارة الإعدادات'] },
  cashier: { label: 'كاشير', items: ['نقطة البيع (POS)', 'سجل المبيعات', 'إدارة العملاء', 'عرض المنتجات', 'طباعة الفواتير'] },
  inventory_manager: { label: 'مدير المخزون', items: ['إدارة المنتجات', 'إدارة المخزون', 'إدارة المشتريات', 'عرض المنتجات'] },
};

export default function SettingsPage() {
  const { toasts, show, remove } = useToast();
  const [tab, setTab] = useState<SettingsTab>('shop');

  // Shop
  const [shop, setShop] = useState<ShopInfo>({ id: 1, name: 'Project Falcon', address: '', phone: '', tax_number: '' });
  const [shopLoading, setShopLoading] = useState(true);
  const [savingShop, setSavingShop] = useState(false);

  // Users
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'cashier' as string });
  const [showPassword, setShowPassword] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  // Currencies (existing)
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [currencyForm, setCurrencyForm] = useState({ code: '', name: '', symbol: '' });
  const [showRateModal, setShowRateModal] = useState(false);
  const [rateCurrency, setRateCurrency] = useState<Currency | null>(null);
  const [rateValue, setRateValue] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyCurrency, setHistoryCurrency] = useState<Currency | null>(null);
  const [historyRates, setHistoryRates] = useState<RateHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchShop = useCallback(async () => {
    try {
      const res = await api.get('/shop');
      setShop(res || { id: 1, name: 'Project Falcon', address: '', phone: '', tax_number: '' });
    } catch (e) {
      show('تعذر الاتصال بالسيرفر', 'error');
    } finally {
      setShopLoading(false);
    }
  }, [show]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/users');
      setUsers(res || []);
    } catch (e) {
      show('تعذر الاتصال بالسيرفر', 'error');
    } finally {
      setUsersLoading(false);
    }
  }, [show]);

  const fetchCurrencies = useCallback(async () => {
    try {
      const res = await api.get('/exchange-rates');
      setCurrencies(res || []);
    } catch (e) {
      show('تعذر الاتصال بالسيرفر', 'error');
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => {
    fetchShop();
    fetchUsers();
    fetchCurrencies();
  }, [fetchShop, fetchUsers, fetchCurrencies]);

  const handleSaveShop = async () => {
    setSavingShop(true);
    try {
      await api.put('/shop', shop);
      show('تم حفظ بيانات المحل', 'success');
    } catch (e) {
      show('فشل حفظ بيانات المحل', 'error');
    } finally {
      setSavingShop(false);
    }
  };

  const handleSaveUser = async () => {
    if (!userForm.name || !userForm.email) {
      show('أكمل جميع الحقول المطلوبة', 'error');
      return;
    }
    if (!editingUser && !userForm.password) {
      show('أدخل كلمة المرور', 'error');
      return;
    }
    setSavingUser(true);
    try {
      if (editingUser) {
        const payload: any = { name: userForm.name, email: userForm.email, role: userForm.role };
        if (userForm.password) payload.password = userForm.password;
        await api.put(`/users/${editingUser.id}`, payload);
        show('تم تحديث المستخدم', 'success');
      } else {
        await api.post('/users', userForm);
        show('تم إضافة المستخدم', 'success');
      }
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({ name: '', email: '', password: '', role: 'cashier' });
      fetchUsers();
    } catch (e) {
      show('فشل حفظ المستخدم', 'error');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter((u) => u.id !== id));
      show('تم حذف المستخدم', 'success');
    } catch (e) {
      show('فشل حذف المستخدم', 'error');
    }
  };

  const openEditUser = (u: UserItem) => {
    setUserForm({ name: u.name, email: u.email, password: '', role: u.role });
    setEditingUser(u);
    setShowUserModal(true);
  };

  const openAddUser = () => {
    setUserForm({ name: '', email: '', password: '', role: 'cashier' });
    setEditingUser(null);
    setShowUserModal(true);
  };

  const handleSaveCurrency = async () => {
    if (!currencyForm.code || !currencyForm.name || !currencyForm.symbol) {
      show('أكمل جميع الحقول', 'error');
      return;
    }
    try {
      if (editingCurrency) {
        await api.put(`/currencies/${editingCurrency.id}`, currencyForm);
        show('تم تحديث العملة', 'success');
      } else {
        await api.post('/currencies', currencyForm);
        show('تم إضافة العملة', 'success');
      }
      setShowCurrencyModal(false);
      setEditingCurrency(null);
      setCurrencyForm({ code: '', name: '', symbol: '' });
      fetchCurrencies();
    } catch (e) {
      show('فشل حفظ العملة', 'error');
    }
  };

  const handleDeleteCurrency = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه العملة؟')) return;
    try {
      await api.delete(`/currencies/${id}`);
      show('تم حذف العملة', 'success');
      fetchCurrencies();
    } catch (e) {
      show('فشل حذف العملة', 'error');
    }
  };

  const handleSetRate = async () => {
    if (!rateCurrency || !rateValue) return;
    const rate = parseFloat(rateValue);
    if (isNaN(rate) || rate <= 0) { show('أدخل سعر صحيح', 'error'); return; }
    try {
      await api.post('/exchange-rates', { currency_id: rateCurrency.id, rate });
      show('تم تحديث سعر الصرف', 'success');
      setShowRateModal(false);
      setRateValue('');
      fetchCurrencies();
    } catch (e) {
      show('فشل تحديث السعر', 'error');
    }
  };

  const openHistory = async (c: Currency) => {
    setHistoryCurrency(c);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/exchange-rates/history/${c.id}`);
      setHistoryRates(res || []);
    } catch (e) {
      show('فشل جلب التاريخ', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  const tabs = [
    { key: 'shop' as SettingsTab, label: 'بيانات المحل', icon: Building2 },
    { key: 'users' as SettingsTab, label: 'المستخدمين', icon: Users },
    { key: 'roles' as SettingsTab, label: 'الأدوار', icon: Shield },
    { key: 'currencies' as SettingsTab, label: 'العملات', icon: Coins },
  ];

  return (
    <div className="settings-page">
      <ToastContainer toasts={toasts} onRemove={remove} />

      <div className="page-header">
        <div>
          <h2>الإعدادات</h2>
          <p>إعدادات النظام والمستخدمين والعملات</p>
        </div>
      </div>

      <div className="settings-tabs">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Shop Tab */}
      {tab === 'shop' && (
        <div className="settings-section">
          <div className="card" style={{ maxWidth: 600 }}>
            <div className="settings-section-header">
              <Building2 size={20} />
              <div>
                <h2>بيانات المحل</h2>
                <p>اسم المحل، العنوان، والبيانات الأساسية</p>
              </div>
            </div>
            <div className="form-grid" style={{ marginTop: 16 }}>
              <div className="form-field full">
                <label>اسم المحل</label>
                <div className="input-icon"><Building2 size={14} /><input value={shop.name} onChange={(e) => setShop({ ...shop, name: e.target.value })} placeholder="اسم المحل" /></div>
              </div>
              <div className="form-field full">
                <label>العنوان</label>
                <div className="input-icon"><MapIcon size={14} /><input value={shop.address} onChange={(e) => setShop({ ...shop, address: e.target.value })} placeholder="عنوان المحل" /></div>
              </div>
              <div className="form-field">
                <label>الهاتف</label>
                <div className="input-icon"><PhoneIcon size={14} /><input value={shop.phone} onChange={(e) => setShop({ ...shop, phone: e.target.value })} placeholder="رقم الهاتف" /></div>
              </div>
              <div className="form-field">
                <label>الرقم الضريبي</label>
                <div className="input-icon"><Tag size={14} /><input value={shop.tax_number} onChange={(e) => setShop({ ...shop, tax_number: e.target.value })} placeholder="الرقم الضريبي" /></div>
              </div>
            </div>
            <div className="modal-footer" style={{ marginTop: 20, padding: 0, border: 0 }}>
              <button className="btn-primary" disabled={savingShop} onClick={handleSaveShop}>
                {savingShop ? 'جاري الحفظ...' : <><Save size={16} /> حفظ</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="settings-section">
          <div className="settings-section-header">
            <Users size={20} />
            <div>
              <h2>المستخدمين</h2>
              <p>إدارة مستخدمي النظام وأدوارهم</p>
            </div>
            <button className="btn-primary" style={{ marginRight: 'auto' }} onClick={openAddUser}>
              <Plus size={16} /> مستخدم جديد
            </button>
          </div>

          <div className="users-table-wrap">
            {usersLoading ? (
              <div className="loading-bar"><i /></div>
            ) : users.length === 0 ? (
              <div className="empty-state">لا يوجد مستخدمين</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>الاسم</th><th>البريد</th><th>الدور</th><th>التاريخ</th><th></th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td><span className={`role-badge ${u.role}`}>{roleLabels[u.role] || u.role}</span></td>
                      <td>{new Date(u.created_at).toLocaleDateString('ar-EG')}</td>
                      <td>
                        <div className="row-actions">
                          <button className="table-action-btn" onClick={() => openEditUser(u)}><Edit3 size={14} /></button>
                          <button className="table-action-btn delete" onClick={() => handleDeleteUser(u.id)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Roles Tab */}
      {tab === 'roles' && (
        <div className="settings-section">
          <div className="settings-section-header">
            <Shield size={20} />
            <div>
              <h2>الأدوار والصلاحيات</h2>
              <p>عرض صلاحيات كل دور في النظام</p>
            </div>
          </div>

          <div className="roles-grid">
            {Object.entries(rolePermissions).map(([key, data]) => (
              <div className="role-card" key={key}>
                <div className="role-card-header">
                  <Shield size={22} />
                  <h3>{data.label}</h3>
                </div>
                <ul className="role-list">
                  {data.items.map((item, idx) => (
                    <li key={idx}><CheckCircle size={14} /> {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Currencies Tab */}
      {tab === 'currencies' && (
        <div className="settings-section">
          <div className="currency-section-header">
            <Coins size={20} />
            <div>
              <h2>العملات وأسعار الصرف</h2>
              <p>إدارة العملات وأسعار التحويل (SDG هو العملة الأساسية)</p>
            </div>
            <button className="btn-primary" style={{ marginRight: 'auto' }} onClick={() => { setEditingCurrency(null); setCurrencyForm({ code: '', name: '', symbol: '' }); setShowCurrencyModal(true); }}>
              <Plus size={16} /> عملة جديدة
            </button>
          </div>

          <div className="info-section">
            <div className="info-row">
              <AlertTriangle size={16} />
              <p>العملة الأساسية هي SDG (الجنيه السوداني). جميع المعاملات تُحفظ بالسعر المستخدم وقتها ولا تتأثر بالتغييرات المستقبلية.</p>
            </div>
          </div>

          {loading ? (
            <div className="loading-bar"><i /></div>
          ) : (
            <div className="currencies-table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>الرمز</th><th>الاسم</th><th>الرمز المختصر</th><th>السعر الحالي (1 وحدة = SDG)</th><th>آخر تحديث</th><th></th></tr>
                </thead>
                <tbody>
                  {currencies.length === 0 ? (
                    <tr><td colSpan={6} className="empty-cell">لا توجد عملات</td></tr>
                  ) : (
                    currencies.map((c) => (
                      <tr key={c.id} className={c.code === 'SDG' ? 'row-base' : ''}>
                        <td><span className={`currency-code ${c.code === 'SDG' ? 'base' : ''}`}>{c.code}</span></td>
                        <td>{c.name}</td>
                        <td>{c.symbol}</td>
                        <td><strong>{c.rate ? c.rate.toLocaleString() : '—'}</strong></td>
                        <td>{c.rate_updated ? new Date(c.rate_updated).toLocaleString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td>
                          <div className="row-actions">
                            {c.code !== 'SDG' && (
                              <>
                                <button className="table-action-btn" title="تحديث سعر" onClick={() => { setRateCurrency(c); setRateValue(''); setShowRateModal(true); }}><TrendingUp size={14} /></button>
                                <button className="table-action-btn" title="تاريخ" onClick={() => openHistory(c)}><History size={14} /></button>
                                <button className="table-action-btn" title="تعديل" onClick={() => { setEditingCurrency(c); setCurrencyForm({ code: c.code, name: c.name, symbol: c.symbol }); setShowCurrencyModal(true); }}><Edit3 size={14} /></button>
                                <button className="table-action-btn delete" title="حذف" onClick={() => handleDeleteCurrency(c.id)}><Trash2 size={14} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? 'تعديل مستخدم' : 'مستخدم جديد'}</h3>
              <button onClick={() => setShowUserModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-field full">
                  <label>الاسم <span className="required">*</span></label>
                  <div className="input-icon"><User size={14} /><input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} placeholder="الاسم الكامل" /></div>
                </div>
                <div className="form-field full">
                  <label>البريد الإلكتروني <span className="required">*</span></label>
                  <div className="input-icon"><MailIcon size={14} /><input value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} placeholder="email@example.com" type="email" /></div>
                </div>
                <div className="form-field full">
                  <label>{editingUser ? 'كلمة المرور (اتركها فارغة إذا لم ترد التغيير)' : 'كلمة المرور *'}</label>
                  <div className="input-icon">
                    <Lock size={14} />
                    <input type={showPassword ? 'text' : 'password'} value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} placeholder="••••••" />
                    <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)} style={{ border: 0, background: 'transparent', cursor: 'pointer' }}>
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="form-field full">
                  <label>الدور</label>
                  <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} style={{ height: 38, border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 12px', fontSize: 13, background: 'white' }}>
                    <option value="admin">مدير النظام</option>
                    <option value="cashier">كاشير</option>
                    <option value="inventory_manager">مدير المخزون</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowUserModal(false)}>إلغاء</button>
              <button className="btn-primary" disabled={savingUser || !userForm.name || !userForm.email || (!editingUser && !userForm.password)} onClick={handleSaveUser}>
                {savingUser ? 'جاري الحفظ...' : <><Save size={16} /> حفظ</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Currency Modal */}
      {showCurrencyModal && (
        <div className="modal-overlay" onClick={() => setShowCurrencyModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCurrency ? 'تعديل العملة' : 'عملة جديدة'}</h3>
              <button onClick={() => setShowCurrencyModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-field full">
                  <label>الرمز الدولي (مثل EGP)</label>
                  <div className="input-icon"><Tag size={14} /><input value={currencyForm.code} onChange={(e) => setCurrencyForm({ ...currencyForm, code: e.target.value.toUpperCase() })} placeholder="EGP" maxLength={5} /></div>
                </div>
                <div className="form-field full">
                  <label>اسم العملة</label>
                  <div className="input-icon"><Banknote size={14} /><input value={currencyForm.name} onChange={(e) => setCurrencyForm({ ...currencyForm, name: e.target.value })} placeholder="الجنيه المصري" /></div>
                </div>
                <div className="form-field full">
                  <label>الرمز المختصر (مثل ج.م)</label>
                  <div className="input-icon"><Coins size={14} /><input value={currencyForm.symbol} onChange={(e) => setCurrencyForm({ ...currencyForm, symbol: e.target.value })} placeholder="ج.م" /></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCurrencyModal(false)}>إلغاء</button>
              <button className="btn-primary" onClick={handleSaveCurrency}>حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Modal */}
      {showRateModal && rateCurrency && (
        <div className="modal-overlay" onClick={() => setShowRateModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>تحديث سعر الصرف</h3>
              <button onClick={() => setShowRateModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="rate-info" style={{ marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 10, fontSize: 12 }}>
                <p style={{ margin: '0 0 4px' }}><strong>العملة:</strong> {rateCurrency.name} ({rateCurrency.code})</p>
                <p style={{ margin: 0, color: '#64748b' }}>السعر الحالي: <strong>{rateCurrency.rate ? `${rateCurrency.rate.toLocaleString()} SDG` : '—'}</strong></p>
              </div>
              <div className="form-field">
                <label>1 {rateCurrency.code} = كم SDG؟</label>
                <div className="input-icon"><TrendingUp size={14} />
                  <input type="number" value={rateValue} onChange={(e) => setRateValue(e.target.value)} placeholder="25" step="0.01" min="0.01" />
                </div>
              </div>
              <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>
                مثال: إذا 1 {rateCurrency.code} = 25 SDG، أدخل 25
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowRateModal(false)}>إلغاء</button>
              <button className="btn-primary" onClick={handleSetRate}>حفظ السعر</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && historyCurrency && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>تاريخ أسعار {historyCurrency.name}</h3>
              <button onClick={() => setShowHistoryModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {historyLoading ? (
                <div className="loading-bar"><i /></div>
              ) : historyRates.length === 0 ? (
                <div className="empty-state">لا يوجد تاريخ</div>
              ) : (
                <div className="history-list">
                  {historyRates.map((h, idx) => (
                    <div className="history-item" key={h.id}>
                      <div className="history-rate">
                        <strong>1 {historyCurrency.code} = {h.rate.toLocaleString()} SDG</strong>
                        {idx === 0 && <span className="current-badge">الحالي</span>}
                      </div>
                      <div className="history-date">
                        {new Date(h.created_at).toLocaleString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowHistoryModal(false)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MapIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
}

function PhoneIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
}

function MailIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
}
