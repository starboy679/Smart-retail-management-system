import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Plus,
  Search,
  X,
  Trash2,
  ArrowRight,
  Calendar,
  Receipt,
  Package,
  TrendingUp,
  Coins,
  ArrowDownCircle,
  Loader2,
  Minus,
} from 'lucide-react';

import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface Product {
  id: number;
  name: string;
  sku: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
}

interface CartItem {
  product: Product;
  qty: number;
  purchasePrice: number;
}

interface Purchase {
  id: number;
  invoice_number: string;
  currency: string;
  exchange_rate: number;
  total: number;
  user_name: string;
  created_at: string;
  items?: number;
}

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  rate: number;
}

export default function Purchases() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [currencies, setCurrencies] = useState<Currency[]>([
    {
      id: 1,
      code: 'SDG',
      name: 'الجنيه السوداني',
      symbol: 'ج.س',
      rate: 1,
    },
    {
      id: 2,
      code: 'USD',
      name: 'الدولار الأمريكي',
      symbol: '$',
      rate: 50.65,
    },
    {
      id: 3,
      code: 'SAR',
      name: 'الريال السعودي',
      symbol: 'ر.س',
      rate: 13.5,
    },
    {
      id: 4,
      code: 'AED',
      name: 'الدرهم الإماراتي',
      symbol: 'د.إ',
      rate: 13.79,
    },
    {
      id: 5,
      code: 'EGP',
      name: 'الجنيه المصري',
      symbol: 'ج.م',
      rate: 115,
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [search, setSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const [cart, setCart] = useState<CartItem[]>([]);

  const [currencyCode, setCurrencyCode] = useState('SDG');
  const [exchangeRate, setExchangeRate] = useState(1);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);

  const selectedCurrency =
    currencies.find((c) => c.code === currencyCode) || currencies[0];

  const fetchData = useCallback(async () => {
    try {
      const [purchasesRes, productsRes, ratesRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/products'),
        api.get('/exchange-rates'),
      ]);

      setPurchases(purchasesRes || []);
      setProducts(productsRes || []);

      if (ratesRes && ratesRes.length > 0) {
        setCurrencies(
          ratesRes.map((c: any) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            symbol: c.symbol || 'ج.س',
            rate: c.rate || 1,
          }))
        );
      }
    } catch (e) {
      console.log('API not connected, using demo data');

      setPurchases([
        {
          id: 1,
          invoice_number: 'PRC-250820-120001-001',
          currency: 'SDG',
          exchange_rate: 1,
          total: 35000,
          user_name: 'أحمد مصطفى',
          created_at: '2025-08-20T10:00:00Z',
          items: 2,
        },
      ]);

      setProducts([
        {
          id: 1,
          name: 'فلتر زيت تويوتا',
          sku: 'FLT-001',
          purchase_price: 120,
          selling_price: 180,
          quantity: 3,
        },
        {
          id: 2,
          name: 'تيل فرامل بوش',
          sku: 'BRK-002',
          purchase_price: 85,
          selling_price: 140,
          quantity: 45,
        },
        {
          id: 3,
          name: 'بوجيهات NGK',
          sku: 'SPK-003',
          purchase_price: 35,
          selling_price: 65,
          quantity: 120,
        },
        {
          id: 4,
          name: 'سير كاتينة كيا',
          sku: 'BEL-004',
          purchase_price: 220,
          selling_price: 380,
          quantity: 28,
        },
        {
          id: 5,
          name: 'فلتر هواء',
          sku: 'AIR-005',
          purchase_price: 45,
          selling_price: 85,
          quantity: 65,
        },
        {
          id: 6,
          name: 'زيت محرك 5W-30',
          sku: 'OIL-006',
          purchase_price: 55,
          selling_price: 95,
          quantity: 200,
        },
        {
          id: 7,
          name: 'صدمة أمامية',
          sku: 'SHK-007',
          purchase_price: 450,
          selling_price: 750,
          quantity: 12,
        },
        {
          id: 8,
          name: 'إطارات',
          sku: 'TIR-008',
          purchase_price: 300,
          selling_price: 520,
          quantity: 80,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (showModal) {
      setTimeout(() => {
        searchRef.current?.focus();
      }, 100);
    }
  }, [showModal]);

  const filteredProducts = products.filter(
    (p) =>
      !cart.find((c) => c.product.id === p.id) &&
      (p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.sku ?? '').toLowerCase().includes(productSearch.toLowerCase()))
  );

  const addToCart = (product: Product) => {
    const defaultPrice =
      currencyCode === 'SDG'
        ? product.purchase_price
        : product.purchase_price / exchangeRate;

    setCart((prev) => [
      ...prev,
      {
        product,
        qty: 1,
        purchasePrice: defaultPrice,
      },
    ]);

    setProductSearch('');
  };

  const updateQty = (id: number, qty: number) => {
    if (qty < 1) return;

    setCart((prev) =>
      prev.map((c) =>
        c.product.id === id
          ? {
            ...c,
            qty,
          }
          : c
      )
    );
  };

  const updatePrice = (id: number, price: number) => {
    if (price < 0) return;

    setCart((prev) =>
      prev.map((c) =>
        c.product.id === id
          ? {
            ...c,
            purchasePrice: price,
          }
          : c
      )
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((c) => c.product.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setProductSearch('');
    setError('');
  };

  const cartTotal = cart.reduce(
    (sum, c) => sum + c.qty * c.purchasePrice,
    0
  );

  const totalInCurrency =
    cartTotal * (currencyCode === 'SDG' ? 1 : exchangeRate);

  const handleCurrencyChange = (code: string) => {
    setCurrencyCode(code);

    const curr = currencies.find((c) => c.code === code);

    if (curr) {
      setExchangeRate(curr.rate);
    }
  };

  const handleSubmit = async () => {
    if (cart.length === 0) {
      setError('أضف منتجات للمخزون');
      return;
    }

    if (totalInCurrency <= 0) {
      setError('المجموع لا يمكن أن يكون صفر');
      return;
    }

    setError('');
    setSaving(true);

    try {
      const payload = {
        total: totalInCurrency,
        currency: currencyCode,
        exchange_rate: exchangeRate,
        user_id: user?.id || 1,

        items: cart.map((c) => ({
          product_id: c.product.id,
          quantity: c.qty,
          purchase_price: c.purchasePrice,
        })),
      };

      const res = await api.post('/purchases', payload);

      clearCart();
      setShowModal(false);

      await fetchData();

      navigate(`/invoice/${res.id}?type=purchase`);
    } catch (e: any) {
      setError(e?.error || 'فشل حفظ المخزون');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPurchases = purchases.reduce(
    (s, p) => s + Number(p.total || 0),
    0
  );

  const totalItems = purchases.reduce(
    (s, p) => s + (p.items || 0),
    0
  );

  const filteredPurchases = purchases.filter(
    (p) =>
      p.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      formatDate(p.created_at).includes(search)
  );

  return (
    <div
      className="purchases-page"
      dir="rtl"
    >
      {/* ================= PAGE STYLE ================= */}

      <style>
        {`
          .purchases-page {
            width: 100%;
          }

          /* ================= MODAL ================= */

          .purchases-page .modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(15, 23, 42, 0.48);
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }

          .purchases-page .purchase-modal {
            width: min(1180px, 96vw);
            max-height: 92vh;
            background: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow:
              0 30px 80px rgba(15, 23, 42, 0.22),
              0 8px 30px rgba(15, 23, 42, 0.10);
            display: flex;
            flex-direction: column;
            animation: purchaseModalIn 0.2s ease-out;
          }

          @keyframes purchaseModalIn {
            from {
              opacity: 0;
              transform: translateY(12px) scale(0.98);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .purchases-page .purchase-modal-header {
            height: 72px;
            padding: 0 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #eef2f7;
            background: #ffffff;
            flex-shrink: 0;
          }

          .purchases-page .purchase-modal-title {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .purchases-page .purchase-modal-title-icon {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #eff6ff;
            color: #dc2626;
          }

          .purchases-page .purchase-modal-title h3 {
            margin: 0;
            font-size: 19px;
            font-weight: 800;
            color: #3d1212;
          }

          .purchases-page .purchase-modal-title p {
            margin: 3px 0 0;
            font-size: 12px;
            color: #94a3b8;
          }

          .purchases-page .purchase-modal-close {
            width: 38px;
            height: 38px;
            border: 0;
            border-radius: 11px;
            background: #f8fafc;
            color: #64748b;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: 0.2s;
          }

          .purchases-page .purchase-modal-close:hover {
            background: #fee2e2;
            color: #dc2626;
          }

          /* ================= MODAL CONTENT ================= */

          .purchases-page .purchase-modal-body {
            overflow: auto;
            padding: 18px;
            background: #f8fafc;
          }

          .purchases-page .purchase-modal-layout {
            display: grid;
            grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.8fr);
            gap: 16px;
            align-items: stretch;
          }

          /* ================= PRODUCTS ================= */

          .purchases-page .purchase-products-panel {
            background: #ffffff;
            border: 1px solid #e7edf4;
            border-radius: 18px;
            padding: 18px;
            min-width: 0;
          }

          .purchases-page .purchase-panel-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 14px;
          }

          .purchases-page .purchase-panel-heading h4 {
            margin: 0;
            font-size: 15px;
            font-weight: 800;
            color: #172033;
          }

          .purchases-page .purchase-panel-heading span {
            font-size: 11px;
            color: #94a3b8;
          }

          .purchases-page .purchase-search {
            height: 48px;
            border: 1px solid #dce4ed;
            border-radius: 13px;
            background: #ffffff;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 0 14px;
            transition: 0.2s;
          }

          .purchases-page .purchase-search:focus-within {
            border-color: #dc2626;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
          }

          .purchases-page .purchase-search svg {
            color: #94a3b8;
            flex-shrink: 0;
          }

          .purchases-page .purchase-search input {
            flex: 1;
            border: 0;
            outline: 0;
            background: transparent;
            color: #172033;
            font-size: 13px;
            font-family: inherit;
          }

          .purchases-page .purchase-search input::placeholder {
            color: #a8b2c0;
          }

          .purchases-page .purchase-search button {
            width: 25px;
            height: 25px;
            border: 0;
            border-radius: 7px;
            background: #f1f5f9;
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }

          .purchases-page .purchase-products-grid {
            margin-top: 14px;
            max-height: 250px;
            overflow-y: auto;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
            padding: 2px;
          }

          .purchases-page .purchase-product-card {
            min-height: 92px;
            border: 1px solid #e5ebf2;
            background: #ffffff;
            border-radius: 14px;
            padding: 12px;
            text-align: right;
            cursor: pointer;
            transition: all 0.18s ease;
            font-family: inherit;
          }

          .purchases-page .purchase-product-card:hover {
            border-color: #93c5fd;
            background: #f8fbff;
            transform: translateY(-1px);
            box-shadow: 0 5px 16px rgba(37, 99, 235, 0.08);
          }

          .purchases-page .purchase-product-name {
            display: block;
            font-size: 13px;
            font-weight: 800;
            color: #1e293b;
            margin-bottom: 9px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .purchases-page .purchase-product-bottom {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
          }

          .purchases-page .purchase-product-price {
            font-size: 12px;
            font-weight: 800;
            color: #dc2626;
          }

          .purchases-page .purchase-product-stock {
            display: flex;
            align-items: center;
            gap: 3px;
            color: #94a3b8;
            font-size: 10px;
          }

          /* ================= CART ================= */

          .purchases-page .purchase-cart-box {
            margin-top: 16px;
            border: 1px solid #e5ebf2;
            border-radius: 16px;
            background: #f8fafc;
            padding: 14px;
          }

          .purchases-page .purchase-cart-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
          }

          .purchases-page .purchase-cart-heading-left {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #1e293b;
            font-size: 13px;
            font-weight: 800;
          }

          .purchases-page .purchase-cart-heading-left svg {
            color: #dc2626;
          }

          .purchases-page .purchase-cart-clear {
            border: 0;
            background: transparent;
            color: #ef4444;
            font-family: inherit;
            font-size: 11px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .purchases-page .purchase-cart-items {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 235px;
            overflow-y: auto;
          }

          .purchases-page .purchase-cart-item {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto auto;
            align-items: center;
            gap: 12px;
            background: #ffffff;
            border: 1px solid #e5ebf2;
            border-radius: 13px;
            padding: 10px 12px;
          }

          .purchases-page .purchase-cart-info {
            min-width: 0;
          }

          .purchases-page .purchase-cart-info strong {
            display: block;
            color: #1e293b;
            font-size: 12px;
            font-weight: 800;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .purchases-page .purchase-cart-info small {
            display: block;
            color: #94a3b8;
            font-size: 10px;
            margin-top: 3px;
          }

          .purchases-page .purchase-qty {
            height: 34px;
            display: flex;
            align-items: center;
            gap: 6px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 9px;
            padding: 2px;
          }

          .purchases-page .purchase-qty button {
            width: 28px;
            height: 28px;
            border: 0;
            border-radius: 7px;
            background: #ffffff;
            color: #334155;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: 0.15s;
          }

          .purchases-page .purchase-qty button:hover {
            background: #e2e8f0;
          }

          .purchases-page .purchase-qty span {
            min-width: 25px;
            text-align: center;
            font-size: 12px;
            font-weight: 800;
            color: #1e293b;
          }

          .purchases-page .purchase-price-area {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .purchases-page .purchase-price-input {
            width: 78px;
            height: 34px;
            border: 1px solid #dce4ed;
            border-radius: 8px;
            outline: 0;
            text-align: center;
            font-size: 11px;
            font-weight: 700;
            color: #1e293b;
            background: #ffffff;
            font-family: inherit;
          }

          .purchases-page .purchase-price-input:focus {
            border-color: #dc2626;
          }

          .purchases-page .purchase-remove {
            width: 30px;
            height: 30px;
            border: 0;
            background: #fff1f2;
            color: #ef4444;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* ================= FINANCIAL PANEL ================= */

          .purchases-page .purchase-financial-panel {
            background: #ffffff;
            border: 1px solid #e7edf4;
            border-radius: 18px;
            padding: 18px;
            display: flex;
            flex-direction: column;
          }

          .purchases-page .financial-title {
            display: flex;
            align-items: center;
            gap: 9px;
            margin-bottom: 16px;
          }

          .purchases-page .financial-title-icon {
            width: 38px;
            height: 38px;
            border-radius: 11px;
            background: #eff6ff;
            color: #dc2626;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .purchases-page .financial-title strong {
            display: block;
            color: #172033;
            font-size: 15px;
            font-weight: 800;
          }

          .purchases-page .financial-title span {
            display: block;
            color: #94a3b8;
            font-size: 10px;
            margin-top: 2px;
          }

          .purchases-page .financial-divider {
            height: 1px;
            background: #eef2f7;
            margin: 15px 0;
          }

          .purchases-page .currency-label {
            font-size: 12px;
            font-weight: 800;
            color: #475569;
            margin-bottom: 9px;
          }

          .purchases-page .currency-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .purchases-page .currency-button {
            min-height: 54px;
            border: 1px solid #e1e8f0;
            border-radius: 11px;
            background: #ffffff;
            color: #475569;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.18s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          }

          .purchases-page .currency-button:hover {
            border-color: #93c5fd;
            background: #f8fbff;
          }

          .purchases-page .currency-button.active {
            border: 2px solid #dc2626;
            background: #eff6ff;
            color: #dc2626;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.10);
          }

          .purchases-page .currency-code {
            font-size: 13px;
            font-weight: 900;
          }

          .purchases-page .currency-symbol {
            font-size: 10px;
            opacity: 0.7;
          }

          .purchases-page .financial-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            min-height: 42px;
          }

          .purchases-page .financial-row > span {
            color: #64748b;
            font-size: 12px;
            font-weight: 600;
          }

          .purchases-page .financial-row > strong {
            color: #172033;
            font-size: 17px;
            font-weight: 900;
          }

          .purchases-page .exchange-box {
            margin-top: 7px;
            padding: 11px;
            border-radius: 11px;
            background: #f8fafc;
            border: 1px solid #e7edf4;
          }

          .purchases-page .exchange-box label {
            display: block;
            color: #64748b;
            font-size: 10px;
            margin-bottom: 7px;
          }

          .purchases-page .exchange-input-wrap {
            height: 42px;
            display: flex;
            align-items: center;
            gap: 7px;
          }

          .purchases-page .exchange-input-wrap input {
            width: 100%;
            height: 100%;
            border: 1px solid #dce4ed;
            border-radius: 9px;
            background: #ffffff;
            outline: 0;
            text-align: center;
            font-size: 13px;
            font-weight: 800;
            font-family: inherit;
          }

          .purchases-page .exchange-input-wrap input:focus {
            border-color: #dc2626;
          }

          .purchases-page .exchange-input-wrap span {
            white-space: nowrap;
            color: #64748b;
            font-size: 10px;
            font-weight: 700;
          }

          .purchases-page .total-highlight {
            margin-top: 4px;
            padding: 14px;
            border-radius: 13px;
            background: #f8fafc;
            border: 1px solid #e5ebf2;
          }

          .purchases-page .total-highlight .financial-row > strong {
            color: #dc2626;
            font-size: 20px;
          }

          .purchases-page .base-total {
            margin-top: 8px;
            padding: 12px 14px;
            border-radius: 12px;
            background: #fef2f2;
            border: 1px solid #fee2e2;
          }

          .purchases-page .base-total .financial-row > strong {
            color: #dc2626;
            font-size: 16px;
          }

          .purchases-page .purchase-error {
            margin-top: auto;
            margin-bottom: 10px;
            padding: 10px 12px;
            border-radius: 10px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            font-size: 11px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .purchases-page .purchase-save-button {
            width: 100%;
            height: 50px;
            margin-top: 14px;
            border: 0;
            border-radius: 12px;
            background: #dc2626;
            color: #ffffff;
            cursor: pointer;
            font-family: inherit;
            font-size: 13px;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-shadow: 0 8px 18px rgba(37, 99, 235, 0.20);
            transition: 0.2s;
          }

          .purchases-page .purchase-save-button:hover:not(:disabled) {
            background: #1d4ed8;
            transform: translateY(-1px);
          }

          .purchases-page .purchase-save-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            box-shadow: none;
          }

          .purchases-page .spin {
            animation: purchaseSpin 0.8s linear infinite;
          }

          @keyframes purchaseSpin {
            to {
              transform: rotate(360deg);
            }
          }

          /* ================= MOBILE ================= */

          @media (max-width: 900px) {
            .purchases-page .purchase-modal {
              max-height: 95vh;
            }

            .purchases-page .purchase-modal-layout {
              grid-template-columns: 1fr;
            }

            .purchases-page .purchase-products-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              max-height: 220px;
            }

            .purchases-page .purchase-financial-panel {
              order: 2;
            }
          }

          @media (max-width: 560px) {
            .purchases-page .modal-overlay {
              padding: 8px;
            }

            .purchases-page .purchase-modal {
              width: 100%;
              border-radius: 18px;
            }

            .purchases-page .purchase-modal-body {
              padding: 10px;
            }

            .purchases-page .purchase-products-grid {
              grid-template-columns: 1fr 1fr;
            }

            .purchases-page .purchase-cart-item {
              grid-template-columns: 1fr;
              gap: 8px;
            }

            .purchases-page .purchase-qty {
              width: fit-content;
            }

            .purchases-page .purchase-price-area {
              justify-content: flex-start;
            }
          }
        `}
      </style>

      {/* ================= PAGE HEADER ================= */}

      <div className="purchases-header">
        <div>
          <h2>المشتريات</h2>
          <p>تسجيل مشتريات المخزون وتتبع التكاليف</p>
        </div>

        <button
          className="btn-primary"
          onClick={() => {
            clearCart();
            setShowModal(true);
          }}
        >
          <Plus size={18} />
          إضافة مخزون
        </button>
      </div>

      {/* ================= KPIs ================= */}

      <div className="purchases-kpis">
        <div className="inv-kpi">
          <div className="inv-kpi-icon blue">
            <ShoppingBag size={18} />
          </div>

          <div>
            <span>عدد المشتريات</span>
            <strong>{purchases.length}</strong>
          </div>
        </div>

        <div className="inv-kpi">
          <div className="inv-kpi-icon green">
            <TrendingUp size={18} />
          </div>

          <div>
            <span>إجمالي المشتريات</span>
            <strong>
              {totalPurchases.toLocaleString()} ج.س
            </strong>
          </div>
        </div>

        <div className="inv-kpi">
          <div className="inv-kpi-icon orange">
            <Package size={18} />
          </div>

          <div>
            <span>إجمالي القطع</span>
            <strong>{totalItems}</strong>
          </div>
        </div>

        <div className="inv-kpi">
          <div className="inv-kpi-icon blue">
            <Coins size={18} />
          </div>

          <div>
            <span>المشتريات اليوم</span>

            <strong>
              {
                purchases.filter(
                  (p) =>
                    new Date(p.created_at).toDateString() ===
                    new Date().toDateString()
                ).length
              }
            </strong>
          </div>
        </div>
      </div>

      {/* ================= SEARCH ================= */}

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث برقم المخزون أو التاريخ..."
          />

          {search && (
            <button onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ================= PURCHASES LIST ================= */}

      {loading ? (
        <div className="loading-bar">
          <i />
        </div>
      ) : (
        <div className="card">
          <div className="section-title">
            <div>
              <h2>سجل المشتريات</h2>
              <p>آخر عمليات إضافة المخزون</p>
            </div>

            <Receipt size={18} />
          </div>

          {filteredPurchases.length === 0 ? (
            <div className="empty-state">
              لا توجد مشتريات مسجلة
            </div>
          ) : (
            <div className="purchases-list">
              {filteredPurchases.map((p) => (
                <div
                  className="purchase-card"
                  key={p.id}
                >
                  <div className="purchase-card-header">
                    <div className="purchase-card-id">
                      <Receipt size={14} />
                      <span>
                        {p.invoice_number || `PRC-${p.id}`}
                      </span>
                    </div>

                    <div
                      className={`purchase-currency ${p.currency || 'SDG'
                        }`}
                    >
                      {p.currency || 'SDG'}
                    </div>
                  </div>

                  <div className="purchase-card-body">
                    <div className="purchase-card-info">
                      <div>
                        <strong>
                          {Number(
                            p.total || 0
                          ).toLocaleString()}{' '}
                          {p.currency === 'SDG' ||
                            !p.currency
                            ? 'ج.س'
                            : p.currency}
                        </strong>

                        <span>
                          {p.items
                            ? `${p.items} منتج`
                            : ''}
                        </span>
                      </div>

                      <div className="purchase-card-date">
                        <Calendar size={12} />
                        {formatDate(p.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="purchase-card-footer">
                    <span>
                      <ArrowRight size={12} />
                      {p.user_name || 'مستخدم'}
                    </span>

                    <span>
                      {p.exchange_rate &&
                        p.exchange_rate !== 1
                        ? `سعر الصرف: ${p.exchange_rate}`
                        : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= ADD STOCK MODAL ================= */}

      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="purchase-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}

            <div className="purchase-modal-header">
              <div className="purchase-modal-title">
                <div className="purchase-modal-title-icon">
                  <Package size={20} />
                </div>

                <div>
                  <h3>إضافة مخزون جديد</h3>
                  <p>
                    اختر المنتجات وحدد تفاصيل عملية الشراء
                  </p>
                </div>
              </div>

              <button
                className="purchase-modal-close"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* BODY */}

            <div className="purchase-modal-body">
              <div className="purchase-modal-layout">

                {/* ================= PRODUCTS + CART ================= */}

                <div className="purchase-products-panel">

                  <div className="purchase-panel-heading">
                    <h4>المنتجات</h4>

                    <span>
                      {products.length} منتج متاح
                    </span>
                  </div>

                  {/* SEARCH */}

                  <div className="purchase-search">
                    <Search size={17} />

                    <input
                      ref={searchRef}
                      value={productSearch}
                      onChange={(e) =>
                        setProductSearch(e.target.value)
                      }
                      placeholder="ابحث باسم المنتج أو الكود..."
                    />

                    {productSearch && (
                      <button
                        onClick={() =>
                          setProductSearch('')
                        }
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* PRODUCTS */}

                  {productSearch && (
                    <div className="purchase-products-grid">
                      {filteredProducts.map((p) => (
                        <button
                          className="purchase-product-card"
                          key={p.id}
                          onClick={() => addToCart(p)}
                        >
                          <span className="purchase-product-name">
                            {p.name}
                          </span>

                          <div className="purchase-product-bottom">
                            <span className="purchase-product-price">
                              {p.purchase_price.toLocaleString()} ج.س
                            </span>

                            <span className="purchase-product-stock">
                              <Package size={10} />
                              {p.quantity}
                            </span>
                          </div>
                        </button>
                      ))}

                      {filteredProducts.length === 0 && (
                        <div
                          className="empty-state"
                          style={{
                            gridColumn: '1 / -1',
                            padding: 20,
                          }}
                        >
                          لا يوجد منتج مطابق
                        </div>
                      )}
                    </div>
                  )}

                  {/* CART */}

                  {cart.length > 0 && (
                    <div className="purchase-cart-box">

                      <div className="purchase-cart-heading">
                        <div className="purchase-cart-heading-left">
                          <ShoppingBag size={16} />
                          <span>
                            المنتجات ({cart.length})
                          </span>
                        </div>

                        <button
                          className="purchase-cart-clear"
                          onClick={clearCart}
                        >
                          <Trash2 size={13} />
                          إفراغ السلة
                        </button>
                      </div>

                      <div className="purchase-cart-items">
                        {cart.map((c) => (
                          <div
                            className="purchase-cart-item"
                            key={c.product.id}
                          >
                            {/* PRODUCT INFO */}

                            <div className="purchase-cart-info">
                              <strong>
                                #{c.product.id} — {c.product.name}
                              </strong>

                              <small>
                                {c.product.sku}
                              </small>
                            </div>

                            {/* QUANTITY */}

                            <div className="purchase-qty">
                              <button
                                onClick={() =>
                                  updateQty(
                                    c.product.id,
                                    c.qty - 1
                                  )
                                }
                              >
                                <Minus size={14} />
                              </button>

                              <span>{c.qty}</span>

                              <button
                                onClick={() =>
                                  updateQty(
                                    c.product.id,
                                    c.qty + 1
                                  )
                                }
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            {/* PRICE */}

                            <div className="purchase-price-area">
                              <input
                                className="purchase-price-input"
                                type="number"
                                min="0"
                                value={c.purchasePrice}
                                onChange={(e) =>
                                  updatePrice(
                                    c.product.id,
                                    Number(e.target.value)
                                  )
                                }
                              />

                              <button
                                className="purchase-remove"
                                onClick={() =>
                                  removeFromCart(
                                    c.product.id
                                  )
                                }
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* EMPTY CART */}

                  {cart.length === 0 && !productSearch && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: '35px 20px',
                        border: '1px dashed #dbe3ec',
                        borderRadius: 15,
                        textAlign: 'center',
                        color: '#94a3b8',
                      }}
                    >
                      <ShoppingBag
                        size={30}
                        style={{
                          marginBottom: 8,
                          opacity: 0.5,
                        }}
                      />

                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        ابحث عن منتج لإضافته للمخزون
                      </div>
                    </div>
                  )}
                </div>

                {/* ================= FINANCIAL ================= */}

                <div className="purchase-financial-panel">

                  <div className="financial-title">
                    <div className="financial-title-icon">
                      <Coins size={18} />
                    </div>

                    <div>
                      <strong>التفاصيل المالية</strong>
                      <span>
                        العملة وقيمة عملية الشراء
                      </span>
                    </div>
                  </div>

                  {/* CURRENCY */}

                  <div className="currency-label">
                    اختر العملة
                  </div>

                  <div className="currency-grid">
                    {currencies.map((c) => {
                      const active =
                        currencyCode === c.code;

                      return (
                        <button
                          key={c.code}
                          className={`currency-button ${active ? 'active' : ''
                            }`}
                          onClick={() =>
                            handleCurrencyChange(c.code)
                          }
                        >
                          <span className="currency-code">
                            {c.code}
                          </span>

                          <span className="currency-symbol">
                            {c.symbol}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* EXCHANGE RATE */}

                  {currencyCode !== 'SDG' && (
                    <div className="exchange-box">
                      <label>
                        سعر الصرف
                      </label>

                      <div className="exchange-input-wrap">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={exchangeRate}
                          onChange={(e) =>
                            setExchangeRate(
                              Number(e.target.value)
                            )
                          }
                        />

                        <span>
                          ج.س / {selectedCurrency.symbol}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="financial-divider" />

                  {/* TOTAL */}

                  <div className="total-highlight">
                    <div className="financial-row">
                      <span>
                        المجموع ({selectedCurrency.symbol})
                      </span>

                      <strong>
                        {cartTotal.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* BASE CURRENCY */}

                  {currencyCode !== 'SDG' && (
                    <div className="base-total">
                      <div className="financial-row">
                        <span>
                          الإجمالي بالجنيه السوداني
                        </span>

                        <strong>
                          {totalInCurrency.toLocaleString()} ج.س
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* ERROR */}

                  {error && (
                    <div className="purchase-error">
                      <X size={14} />
                      {error}
                    </div>
                  )}

                  {/* SAVE */}

                  <button
                    className="purchase-save-button"
                    disabled={
                      cart.length === 0 || saving
                    }
                    onClick={handleSubmit}
                  >
                    {saving ? (
                      <>
                        <Loader2
                          size={18}
                          className="spin"
                        />
                        جاري حفظ المخزون...
                      </>
                    ) : (
                      <>
                        <ArrowDownCircle size={18} />
                        حفظ المخزون
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}