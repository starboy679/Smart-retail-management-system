import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Printer, ArrowRight, ShoppingCart, RotateCcw, CheckCircle, Receipt, Building2, ShoppingBag
} from 'lucide-react';
import api from '../api/axios';

interface InvoiceItem {
  id: number;
  product_name: string;
  sku: string;
  quantity: number;
  price: number;
  currency?: string;
  exchange_rate?: number;
  unit_price?: number;
  unit_price_sdg?: number;
  purchase_price?: number;
}

interface InvoiceData {
  id: number;
  invoice_number: string;
  customer_name?: string;
  subtotal?: number;
  discount?: number;
  total: number;
  currency?: string;
  exchange_rate?: number;
  created_at: string;
  user_name: string;
  items: InvoiceItem[];
}

export default function Invoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isPurchase = searchParams.get('type') === 'purchase';

  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const endpoint = isPurchase
          ? `/purchases/${id}`
          : `/sales/${id}`;

        const res = await api.get(endpoint);
        setData(res);
      } catch (e) {
        setError(
          isPurchase
            ? 'لم يتم العثور على المخزون'
            : 'لم يتم العثور على الفاتورة'
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, isPurchase]);

  if (loading) {
    return (
      <div className="page-center">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-center">
        <div className="placeholder-card">
          <Receipt size={40} />
          <p>{error}</p>
          <button
            className="btn-primary mt-12"
            onClick={() => navigate(isPurchase ? '/purchases' : '/pos')}
          >
            <ArrowRight size={16} />
            {isPurchase ? 'العودة للمشتريات' : 'العودة للبيع'}
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => window.print();

  const backLabel = isPurchase ? 'مخزون جديد' : 'بيع جديد';
  const backPath = isPurchase ? '/purchases' : '/pos';
  const title = isPurchase ? 'إيصال مخزون' : 'فاتورة';

  const totalLabelForgin = isPurchase
    ? 'إجمالي المخزون'
    : 'الإجمالي';

  const totalLabel = isPurchase
    ? 'الإجمالي بالجنيه السوداني'
    : 'الإجمالي';

  // تحديد عملة الفاتورة من بيانات الفاتورة نفسها في حالة الشراء
  const invoiceCurrency = isPurchase
    ? (data.currency || 'SDG')
    : (
        data.items?.find(
          (item: any) => item.currency && item.currency !== 'SDG'
        )?.currency || 'SDG'
      );

  // حساب الإجمالي بالعملة الأصلية
  const totalOriginal = data.items.reduce(
    (sum, item) => {
      const price = Number(
        isPurchase
          ? item.purchase_price
          : (item.unit_price ?? item.price)
      );

      return sum + Number(item.quantity) * price;
    },
    0
  );

  return (
    <div className="invoice-page">

      <div className="invoice-actions">
        <button
          className="btn-secondary"
          onClick={() => navigate(backPath)}
        >
          <ArrowRight size={16} />
          {backLabel}
        </button>

        <button
          className="btn-secondary"
          onClick={handlePrint}
        >
          <Printer size={16} />
          طباعة
        </button>
      </div>

      <div className="invoice-paper">

        <div className="invoice-header">

          <div className="invoice-brand">
            <div className="invoice-logo">
              <img src="/logo.svg" alt="A&A" />
            </div>

            <div>
              <h2>A&A</h2>
              <p>قطع غيار السيارات</p>
            </div>
          </div>

          <div className="invoice-meta">

            <div className={`invoice-tag ${isPurchase ? 'purchase' : ''}`}>
              {isPurchase
                ? <ShoppingBag size={14} />
                : <Receipt size={14} />
              }

              <span>{title}</span>
            </div>

            <div className="invoice-number">
              {data.invoice_number}
            </div>

            <div className="invoice-date">
              {new Date(data.created_at).toLocaleString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>

          </div>
        </div>

        <div className="invoice-customer">

          {!isPurchase && (
            <div>
              <strong>العميل:</strong>
              {' '}
              {data.customer_name || 'عميل نقدي'}
            </div>
          )}

          {isPurchase && (
            <div>
              <strong>المستخدم:</strong>
              {' '}
              {data.user_name || 'مستخدم'}
            </div>
          )}

          {isPurchase && data.currency && data.currency !== 'SDG' && (
            <div>
              <strong>العملة:</strong>
              {' '}
              {data.currency}
              {' '}
              (سعر الصرف: {Number(data.exchange_rate).toLocaleString()})
            </div>
          )}

        </div>

        <table className="invoice-table">

          <thead>
            <tr>
              <th>#</th>
              <th>المنتج</th>
              <th>SKU</th>
              <th>الكمية</th>
              <th>السعر</th>
              <th>الإجمالي</th>
            </tr>
          </thead>

          <tbody>

            {data.items.map((item: any, i) => {

              // العملة في المشتريات موجودة في مستوى الفاتورة
              const itemCurrency = isPurchase
                ? (data.currency || 'SDG')
                : (item.currency || 'SDG');

              const isForeignItem = itemCurrency !== 'SDG';

              const sku = item.sku ?? item.product_sku;

              // السعر الأصلي بالعملة المختارة
              const unitPriceOriginal = Number(
                isPurchase
                  ? item.purchase_price
                  : (item.unit_price ?? item.price)
              );

              // سعر الصرف
              const exchangeRate = Number(
                item.exchange_rate ?? data.exchange_rate ?? 1
              );

              // سعر الوحدة بالجنيه السوداني
              const unitPriceSdg = item.unit_price_sdg != null
                ? Number(item.unit_price_sdg)
                : itemCurrency === 'SDG'
                  ? unitPriceOriginal
                  : unitPriceOriginal * exchangeRate;

              // إجمالي الصنف بالعملتين
              const lineTotalOriginal =
                Number(item.quantity) * unitPriceOriginal;

              const lineTotalSdg =
                Number(item.quantity) * unitPriceSdg;

              return (

                <tr key={item.id}>

                  <td>{i + 1}</td>

                  <td>{item.product_name}</td>

                  <td className="cell-mono">
                    {sku || '-'}
                  </td>

                  <td>{item.quantity}</td>

                  {/* سعر الوحدة */}
                  <td>

                    <div>
                      {unitPriceOriginal.toLocaleString(undefined, {
                        maximumFractionDigits: 2
                      })} {itemCurrency}
                    </div>

                    {isForeignItem && (
                      <div style={{
                        fontSize: 10,
                        color: '#94a3b8'
                      }}>
                        ≈ {unitPriceSdg.toLocaleString(undefined, {
                          maximumFractionDigits: 2
                        })} ج.س
                      </div>
                    )}

                  </td>

                  {/* إجمالي الصنف */}
                  <td>

                    <strong>
                      {lineTotalOriginal.toLocaleString(undefined, {
                        maximumFractionDigits: 2
                      })} {itemCurrency}
                    </strong>

                    {isForeignItem && (
                      <div style={{
                        fontSize: 10,
                        color: '#94a3b8'
                      }}>
                        ≈ {lineTotalSdg.toLocaleString(undefined, {
                          maximumFractionDigits: 2
                        })} ج.س
                      </div>
                    )}

                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>

        <div className="invoice-totals">

          {!isPurchase && data.subtotal !== undefined && (
            <div className="invoice-total-row">
              <span>المجموع</span>

              <strong>
                {Number(data.subtotal).toLocaleString()} ج.س
              </strong>
            </div>
          )}

          {!isPurchase && data.discount && data.discount > 0 && (
            <div className="invoice-total-row discount">
              <span>الخصم</span>

              <strong>
                -{Number(data.discount).toLocaleString()} ج.س
              </strong>
            </div>
          )}

          <div className="invoice-total-row grand">

            <span>{totalLabelForgin}</span>

            <strong>
              {totalOriginal.toLocaleString(undefined, {
                maximumFractionDigits: 2
              })} {invoiceCurrency}
            </strong>

            <span>{totalLabel}</span>

            <strong>
              {Number(data.total).toLocaleString(undefined, {
                maximumFractionDigits: 2
              })} ج.س
            </strong>

          </div>

        </div>

        <div className="invoice-footer">

          <div className="invoice-stamp">
            <CheckCircle size={20} />

            <span>
              {isPurchase ? 'تم الاستلام' : 'تم الدفع'}
            </span>
          </div>

          <p>شكراً لتعاملكم معنا</p>

        </div>

      </div>

    </div>
  );
}