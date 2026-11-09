import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Minus, Trash2, X, ShoppingCart, Package, Banknote,
  ArrowRight, User, Receipt, RotateCcw, Calculator, AlertTriangle, Coins, Pencil
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface Product {
  id: number;
  name: string;
  sku: string;
  selling_price: number;
  quantity: number;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
}

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  rate: number; // SDG per 1 unit of this currency
}

interface CartItem {
  product: Product;
  qty: number;
  // Empty string = use the auto-calculated price for the selected currency.
  // Non-empty = user override, in the selected currency's units.
  customPrice: string;
}

export default function POS() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const searchRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [discount, setDiscount] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [p, c] = await Promise.all([
          api.get('/products'),
          api.get('/customers'),
        ]);
        setProducts(p || []);
        setCustomers(c || []);
        try{
          

          const  cur = await api.get('/exchange-rates');
          const allCurrencies = (cur || []).map((c: any) => ({
              
            id: c.id,
            code: c.code,
            name: c.name,
            symbol: c.symbol,
            rate: c.rate || 1
            
          }));
          setCurrencies(allCurrencies);

          const sdg = allCurrencies.find(
            (c: Currency) => c.code === 'SDG'
          );
          if (sdg){
            setSelectedCurrency(sdg);
          }
        }catch (currencyError) {
          console.error('Failed to Exchange rates:', currencyError);
          setCurrencies([]);
        }
      
      } catch (e) {
        console.error('Failed to Connect to API', e);
        setProducts([]);
        setCurrencies([]);
        setCustomers([]);
      }
    }
    load();
  }, []);

  const filtered = products.filter((p) => {
    const term = search.toLowerCase().trim();
    return !term || p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term);
  });

  const addToCart = (product: Product) => {
    const existing = cart.find((c) => c.product.id === product.id);
    if (existing) {
      if (existing.qty >= product.quantity) {
        setError(`المخزون متاح: ${product.quantity} قطع فقط لـ ${product.name}`);
        setTimeout(() => setError(''), 3000);
        return;
      }
      setCart(cart.map((c) => (c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c)));
    } else {
      if (product.quantity <= 0) {
        setError(`المنتج ${product.name} غير متوفر في المخزون`);
        setTimeout(() => setError(''), 3000);
        return;
      }
      setCart([...cart, { product, qty: 1, customPrice: '' }]);
    }
    setSearch('');
    searchRef.current?.focus();
  };

  const updateQty = (productId: number, delta: number) => {
    setCart(cart.map((c) => {
      if (c.product.id !== productId) return c;
      const newQty = c.qty + delta;
      if (newQty <= 0) return c;
      if (newQty > c.product.quantity) {
        setError(`المخزون متاح: ${c.product.quantity} قطع فقط`);
        setTimeout(() => setError(''), 3000);
        return c;
      }
      return { ...c, qty: newQty };
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((c) => c.product.id !== productId));
  };

  const updateCustomPrice = (productId: number, value: string) => {
    setCart(cart.map((c) => (c.product.id === productId ? { ...c, customPrice: value } : c)));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setSelectedCustomer(null);
    setError('');
  };

  const exchangeRate = selectedCurrency?.rate || 1;
  const isForeign = !!selectedCurrency && selectedCurrency.code !== 'SDG';

  // Default price in the selected currency = product's SDG default price
  // converted at the current rate. The user may override it per line.
  const autoPriceFor = (product: Product) => (isForeign ? product.selling_price / exchangeRate : product.selling_price);
  const actualPriceFor = (c: CartItem) => {
    const custom = parseFloat(c.customPrice);
    return c.customPrice !== '' && !isNaN(custom) ? custom : autoPriceFor(c.product);
  };
  // Same unit price converted to SDG, used for subtotal/total display in the base currency.
  const priceSdgFor = (c: CartItem) => {
    const price = actualPriceFor(c);
    return isForeign ? price * exchangeRate : price;
  };

  const subtotal = cart.reduce((sum, c) => sum + c.qty * priceSdgFor(c), 0);
  const total = Math.max(subtotal - discount, 0);

  const handleComplete = async () => {
    if (cart.length === 0) return;
    setCompleting(true);
    try {
      const items = cart.map((c) => ({
        product_id: c.product.id,
        quantity: c.qty,
        currency: selectedCurrency?.code || 'SDG',
        exchange_rate: exchangeRate,
        unit_price: actualPriceFor(c),
      }));
      const res = await api.post('/sales', {
        customer_id: selectedCustomer?.id || null,
        discount,
        items,
        user_id: user?.id || 1,
      });
      navigate(`/invoice/${res.id}`);
    } catch (e: any) {
      setError(e?.error || 'حدث خطأ أثناء إتمام البيع');
      setTimeout(() => setError(''), 4000);
    } finally {
      setCompleting(false);
    }
  };

  const handleNewCustomer = async () => {
    if (!newCustomerName.trim()) return;
    try {
      const res = await api.post('/customers', { name: newCustomerName.trim(), phone: newCustomerPhone.trim() });
      setCustomers([...customers, { id: res.id, name: res.name, phone: res.phone }]);
      setSelectedCustomer({ id: res.id, name: res.name, phone: res.phone });
      setShowNewCustomer(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
    } catch (e) {
      console.error('Failed to create customer', e);
    }
  };

  return (
    <div className="pos-page">
      <div className="pos-header">
        <div>
          <h2>نقطة البيع</h2>
          <p>سجل مبيعات جديدة بسرعة</p>
        </div>
        <div className="pos-actions">
          <button className="btn-secondary" onClick={() => navigate('/sales')}><Receipt size={16} /> المبيعات</button>
        </div>
      </div>

      {error && <div className="pos-error"><AlertTriangle size={16} /> {error}</div>}

      <div className="pos-layout">
        {/* LEFT: Product Search */}
        <div className="pos-products">
          <div className="pos-search">
            <Search size={18} />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المنتج أو SKU..."
            />
            {search && <button onClick={() => { setSearch(''); searchRef.current?.focus(); }}><X size={16} /></button>}
          </div>

          <div className="pos-grid">
            {search.trim() ? (
              filtered.length === 0 ? (
                <div className="pos-empty">لا توجد منتجات</div>
              ) : (
                filtered.map((p) => (
                  <button key={p.id} className="pos-card" onClick={() => addToCart(p)} disabled={p.quantity <= 0}>
                    <div className="pos-card-name">{p.name}</div>
                    <div className="pos-card-bottom">
                      <span className="pos-card-price">{p.selling_price.toLocaleString()} ج.س</span>
                      <span className={`pos-card-stock ${p.quantity <= 0 ? 'out' : p.quantity <= 5 ? 'low' : ''}`}>
                        <Package size={12} /> {p.quantity} قطع
                      </span>
                    </div>
                    {p.quantity <= 0 && <span className="pos-card-overlay">نفد المخزون</span>}
                  </button>
                ))
              )
            ) : (
              products.slice(0, 12).map((p) => (
                <button key={p.id} className="pos-card" onClick={() => addToCart(p)} disabled={p.quantity <= 0}>
                  <div className="pos-card-name">{p.name}</div>
                  <div className="pos-card-bottom">
                    <span className="pos-card-price">{p.selling_price.toLocaleString()} ج.س</span>
                    <span className={`pos-card-stock ${p.quantity <= 0 ? 'out' : p.quantity <= 5 ? 'low' : ''}`}>
                      <Package size={12} /> {p.quantity} قطع
                    </span>
                  </div>
                  {p.quantity <= 0 && <span className="pos-card-overlay">نفد المخزون</span>}
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Cart */}
        <div className="pos-cart">
          <div className="pos-cart-header">
            <ShoppingCart size={18} />
            <span>سلة المشتريات</span>
            <span className="pos-cart-count">{cart.length} منتج</span>
          </div>

          {cart.length === 0 ? (
            <div className="pos-cart-empty">
              <ShoppingCart size={40} />
              <p>السلة فارغة</p>
              <span>ابحث عن منتج وانقر لإضافته</span>
            </div>
          ) : (
            <>
              <div className="pos-cart-items">
                {cart.map((c) => {
                  const auto = autoPriceFor(c.product);
                  const isOverridden = c.customPrice !== '' && !isNaN(parseFloat(c.customPrice));
                  return (
                    <div className="pos-cart-item" key={c.product.id}>
                      <div className="pos-cart-info">
                        <div className="pos-cart-title">{c.product.name}</div>
                        <div className="pos-cart-meta">
                          {c.product.selling_price.toLocaleString()} ج.س (افتراضي)
                          {isForeign && <> · تلقائي: {auto.toLocaleString(undefined, { maximumFractionDigits: 2 })} {selectedCurrency?.symbol}</>}
                        </div>
                        <div className="pos-discount-input" style={{ marginTop: 4 }}>
                          <Pencil size={12} />
                          <input
                            type="number"
                            min={0}
                            placeholder={auto.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            value={c.customPrice}
                            onChange={(e) => updateCustomPrice(c.product.id, e.target.value)}
                          />
                          <span>{selectedCurrency?.symbol || 'ج.س'}</span>
                        </div>
                        {isOverridden && <div className="pos-cart-meta" style={{ color: '#d97706' }}>سعر مخصص لهذه العملية فقط</div>}
                      </div>
                      <div className="pos-cart-controls">
                        <button onClick={() => updateQty(c.product.id, -1)}><Minus size={14} /></button>
                        <span>{c.qty}</span>
                        <button onClick={() => updateQty(c.product.id, 1)}><Plus size={14} /></button>
                      </div>
                      <div className="pos-cart-total">{(c.qty * priceSdgFor(c)).toLocaleString(undefined, { maximumFractionDigits: 2 })} ج.س</div>
                      <button className="pos-cart-remove" onClick={() => removeFromCart(c.product.id)}><Trash2 size={14} /></button>
                    </div>
                  );
                })}
              </div>

              <div className="pos-cart-actions">
                <button className="pos-clear-btn" onClick={clearCart}>
                  <RotateCcw size={14} /> إفراغ السلة
                </button>
              </div>
            </>
          )}

          {/* Customer */}
          <div className="pos-section">
            <div className="pos-section-label"><User size={14} /> العميل</div>
            <button className="pos-customer-btn" onClick={() => setShowCustomerModal(true)}>
              {selectedCustomer ? (
                <span>{selectedCustomer.name} {selectedCustomer.phone && `(${selectedCustomer.phone})`}</span>
              ) : (
                <span>عميل نقدي — اختر عميل</span>
              )}
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Currency */}
          <div className="pos-section">
            <div className="pos-section-label"><Coins size={14} /> العملة</div>
            <div className="pos-currency-selector">
              {currencies.map((c) => (
                <button
                  key={c.id}
                  className={selectedCurrency?.id === c.id ? 'active' : ''}
                  onClick={() => setSelectedCurrency(c)}
                >
                  {c.code === 'SDG' ? <Banknote size={14} /> : <Coins size={14} />}
                  {c.code}
                  {c.rate && c.code !== 'SDG' && (
                    <small>1 {c.code} = {c.rate.toLocaleString()} SDG</small>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Totals — always shown in SDG, the shop's base currency, regardless of the sale currency selected above */}
          <div className="pos-totals">
            <div className="pos-total-row">
              <span>المجموع</span>
              <strong>{subtotal.toLocaleString(undefined, { maximumFractionDigits: 2 })} ج.س</strong>
            </div>
            <div className="pos-total-row">
              <span>الخصم</span>
              <div className="pos-discount-input">
                <Calculator size={14} />
                <input
                  type="number"
                  min={0}
                  max={subtotal}
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Math.min(subtotal, Number(e.target.value))))}
                />
                <span>ج.س</span>
              </div>
            </div>
            <div className="pos-total-row total">
              <span>الإجمالي (نقدي)</span>
              <strong>{total.toLocaleString(undefined, { maximumFractionDigits: 2 })} ج.س</strong>
            </div>
          </div>

          {/* Complete — payment is always cash, so there's nothing more to enter */}
          <button
            className="pos-complete-btn"
            disabled={cart.length === 0 || completing}
            onClick={handleComplete}
          >
            <Banknote size={16} /> {completing ? 'جاري إتمام البيع...' : `إتمام البيع  — ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })} ج.س`}
          </button>
        </div>
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="modal-overlay" onClick={() => setShowCustomerModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>اختيار العميل</h3>
              <button onClick={() => setShowCustomerModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="customer-list">
                <button className="customer-item" onClick={() => { setSelectedCustomer(null); setShowCustomerModal(false); }}>
                  <span>عميل نقدي</span>
                  {!selectedCustomer && <CheckCircle className="customer-check" />}
                </button>
                {customers.map((c) => (
                  <button className="customer-item" key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerModal(false); }}>
                    <span>{c.name} {c.phone && <small>{c.phone}</small>}</span>
                    {selectedCustomer?.id === c.id && <CheckCircle className="customer-check" />}
                  </button>
                ))}
              </div>
              <button className="btn-secondary full-width mt-12" onClick={() => { setShowNewCustomer(true); setShowCustomerModal(false); }}>
                <Plus size={14} /> عميل جديد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {showNewCustomer && (
        <div className="modal-overlay" onClick={() => setShowNewCustomer(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>عميل جديد</h3>
              <button onClick={() => setShowNewCustomer(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-field full">
                <label>الاسم</label>
                <input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="اسم العميل" />
              </div>
              <div className="form-field full">
                <label>الهاتف</label>
                <input value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} placeholder="رقم الهاتف" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowNewCustomer(false)}>إلغاء</button>
              <button className="btn-primary" onClick={handleNewCustomer} disabled={!newCustomerName.trim()}>حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
