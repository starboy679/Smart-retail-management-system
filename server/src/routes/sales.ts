import { Router } from 'express';
import pool from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';
import { details } from 'framer-motion/client';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['admin', 'cashier']));

function generateInvoiceNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const r = Math.floor(Math.random() * 900) + 100;
  return `INV-${y}${m}${d}-${h}${min}${s}-${r}`;
}

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, c.name as customer_name, u.name as user_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN users u ON s.user_id = u.id
       ORDER BY s.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [saleRows]: any = await pool.query(
      `SELECT s.*, c.name as customer_name, c.phone as customer_phone, u.name as user_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [req.params.id]
    );
    if (saleRows.length === 0) return res.status(404).json({ error: 'Sale not found' });

    const [itemRows]: any = await pool.query(
      `SELECT si.*, p.name as product_name, p.sku
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ?`,
      [req.params.id]
    );

    res.json({ ...saleRows[0], items: itemRows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sale' });
  }
});

router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { customer_id, discount, items, user_id } = req.body;

    if (!items || items.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Sale must contain at least one item' });
    }

    // Each item carries its own transaction currency/rate/unit_price snapshot.
    // Server recomputes the SDG equivalent rather than trusting a client-sent
    // total, so subtotal/total (always SDG, the shop's base currency) can't
    // be tampered with or drift from the line items.
    let subtotal = 0;
    const resolvedItems: any[] = [];

    for (const item of items) {
      const [productRows]: any = await conn.query(
        'SELECT id, quantity, purchase_price FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]
      );
      if (productRows.length === 0) {
        await conn.rollback();
        return res.status(400).json({ error: `Product ${item.product_id} not found` });
      }
      const product = productRows[0];
      if (product.quantity < item.quantity) {
        await conn.rollback();
        return res.status(400).json({ error: `Insufficient stock for product ${item.product_id}` });
      }

      const currency = item.currency || 'SDG';
      const exchangeRate = Number(item.exchange_rate) || 1;
      const unitPrice = Number(item.unit_price);
      const unitPriceSdg = currency === 'SDG' ? unitPrice : unitPrice * exchangeRate;
      const lineTotal = unitPriceSdg * item.quantity;
      subtotal += lineTotal;

      resolvedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        currency,
        exchange_rate: exchangeRate,
        unit_price: unitPrice,
        unit_price_sdg: unitPriceSdg,
        unit_cost_sdg: Number(product.purchase_price) || 0
      });
    }

    const discountAmount = Number(discount) || 0;
    const total = Math.max(subtotal - discountAmount, 0);
    const invoiceNumber = generateInvoiceNumber();

    const [result]: any = await conn.query(
      `INSERT INTO sales (invoice_number, customer_id, subtotal, discount, total, user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [invoiceNumber, customer_id || null, subtotal, discountAmount, total, user_id]
    );
    const saleId = result.insertId;

    for (const item of resolvedItems) {
      await conn.query(
        `INSERT INTO sale_items
         (sale_id, product_id, quantity, price, currency, exchange_rate, unit_price, unit_price_sdg, unit_cost_sdg)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          saleId,
          item.product_id,
          item.quantity,
          item.unit_price_sdg,
          item.currency,
          item.exchange_rate,
          item.unit_price,
          item.unit_price_sdg,
          item.unit_cost_sdg
        ]
      );
      await conn.query('UPDATE products SET quantity = quantity - ? WHERE id = ?', [item.quantity, item.product_id]);
      await conn.query(
        'INSERT INTO inventory_movements (product_id, type, quantity, reference_type, reference_id, user_id) VALUES (?, ?, ?, ?, ?, ?)',
        [item.product_id, 'out', item.quantity, 'sale', saleId, user_id]
      );
    }

    await conn.commit();
    res.json({ id: saleId, invoice_number: invoiceNumber });
  } catch (err) {
    await conn.rollback();
    console.error('SALE ERROR:', err);
    res.status(500).json({ 
      error: 'Failed to create sale',
      details: err instanceof Error ? err.message : String(err)
    });
  } finally {
    conn.release();
  }
});

export default router;
