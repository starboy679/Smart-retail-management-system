import { Router } from 'express';
import pool from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

function generatePurchaseNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const r = Math.floor(Math.random() * 900 + 100);
  return `PRC-${y}${m}${d}-${h}${min}${s}-${r}`;
}

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['admin', 'inventory_manager']));

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.name as user_name FROM purchases p
       LEFT JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [purchaseRows]: any = await pool.query(
      `SELECT p.*, u.name as user_name FROM purchases p
       LEFT JOIN users u ON p.user_id = u.id WHERE p.id = ?`,
      [req.params.id]
    );
    if (purchaseRows.length === 0) return res.status(404).json({ error: 'Purchase not found' });

    const [itemRows] = await pool.query(
      `SELECT pi.*, pr.name as product_name, pr.sku as product_sku
       FROM purchase_items pi
       JOIN products pr ON pi.product_id = pr.id
       WHERE pi.purchase_id = ?`,
      [req.params.id]
    );
    res.json({ ...purchaseRows[0], items: itemRows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch purchase' });
  }
});

router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { total, items, currency, exchange_rate, user_id } = req.body;
    const invoiceNumber = generatePurchaseNumber();

    const [result]: any = await conn.query(
      'INSERT INTO purchases (invoice_number, total, currency, exchange_rate, user_id) VALUES (?, ?, ?, ?, ?)',
      [invoiceNumber, total, currency || 'EGP', exchange_rate || 1, user_id]
    );
    const purchaseId = result.insertId;

    for (const item of items || []) {
      await conn.query(
        'INSERT INTO purchase_items (purchase_id, product_id, quantity, purchase_price) VALUES (?, ?, ?, ?)',
        [purchaseId, item.product_id, item.quantity, item.purchase_price]
      );
      await conn.query('UPDATE products SET quantity = quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
      // Update the product's current default cost to what was actually just
      // paid (converted to SDG). This only affects future default cost
      // display/calculations — purchase_items above keeps this purchase's
      // original-currency price + the purchase's exchange-rate snapshot
      // untouched, so past purchases and past sale profit are never rewritten.
      const rate = Number(exchange_rate) || 1;
      const costSdg = (currency || 'EGP') === 'SDG' ? Number(item.purchase_price) : Number(item.purchase_price) * rate;
      await conn.query('UPDATE products SET purchase_price = ? WHERE id = ?', [costSdg, item.product_id]);
      await conn.query(
        'INSERT INTO inventory_movements (product_id, type, quantity, reference_type, reference_id, user_id) VALUES (?, ?, ?, ?, ?, ?)',
        [item.product_id, 'in', item.quantity, 'purchase', purchaseId, user_id]
      );
    }

    await conn.commit();
    res.json({ id: purchaseId, invoice_number: invoiceNumber });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Failed to create purchase' });
  } finally {
    conn.release();
  }
});

export default router;
