import { Router } from 'express';
import pool from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['admin']));

function getDateRange(filter: string) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  switch (filter) {
    case 'today': {
      const today = now.toISOString().split('T')[0];
      return { from: today + ' 00:00:00', to: today + ' 23:59:59' };
    }
    case 'week': {
      const start = new Date(y, m, d - now.getDay());
      const end = new Date(y, m, d, 23, 59, 59);
      return { from: start.toISOString().split('T')[0] + ' 00:00:00', to: end.toISOString().replace('T', ' ').split('.')[0] };
    }
    case 'month': {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0, 23, 59, 59);
      return { from: start.toISOString().split('T')[0] + ' 00:00:00', to: end.toISOString().replace('T', ' ').split('.')[0] };
    }
    default:
      return { from: '1970-01-01 00:00:00', to: '2099-12-31 23:59:59' };
  }
}

router.get('/sales', async (req, res) => {
  try {
    const { filter, from, to } = req.query as any;
    const range = from && to ? { from: from + ' 00:00:00', to: to + ' 23:59:59' } : getDateRange(filter || 'today');

    const [rows]: any = await pool.query(
      `SELECT s.*, c.name as customer_name, u.name as user_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.created_at BETWEEN ? AND ?
       ORDER BY s.created_at DESC`,
      [range.from, range.to]
    );
    const total = rows.reduce((sum: number, s: any) => sum + Number(s.total || 0), 0);
    const count = rows.length;
    res.json({ rows, total, count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sales report' });
  }
});

router.get('/purchases', async (req, res) => {
  try {
    const { filter, from, to } = req.query as any;
    const range = from && to ? { from: from + ' 00:00:00', to: to + ' 23:59:59' } : getDateRange(filter || 'today');

    const [rows]: any = await pool.query(
      `SELECT p.*, u.name as user_name
       FROM purchases p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.created_at BETWEEN ? AND ?
       ORDER BY p.created_at DESC`,
      [range.from, range.to]
    );
    const total = rows.reduce((sum: number, p: any) => sum + Number(p.total || 0), 0);
    const count = rows.length;
    res.json({ rows, total, count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch purchases report' });
  }
});

router.get('/profit', async (req, res) => {
  try {
    const { filter, from, to } = req.query as any;
    const range = from && to ? { from: from + ' 00:00:00', to: to + ' 23:59:59' } : getDateRange(filter || 'today');

    // Uses per-item historical snapshots (unit_price_sdg, unit_cost_sdg), not
    // the live product price/cost, so changing a product's price or cost
    // today never rewrites profit on past sales.
    const [saleItems]: any = await pool.query(
      `SELECT si.unit_price_sdg, si.unit_cost_sdg, si.quantity
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       WHERE s.created_at BETWEEN ? AND ?`,
      [range.from, range.to]
    );
    const totalRevenue = saleItems.reduce((sum: number, item: any) => sum + Number(item.unit_price_sdg || 0) * Number(item.quantity || 0), 0);
    const totalCost = saleItems.reduce((sum: number, item: any) => sum + Number(item.unit_cost_sdg || 0) * Number(item.quantity || 0), 0);
    const profit = totalRevenue - totalCost;

    const [sales]: any = await pool.query(
      `SELECT s.*, c.name as customer_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.created_at BETWEEN ? AND ?
       ORDER BY s.created_at DESC`,
      [range.from, range.to]
    );
    res.json({ totalRevenue, totalCost, profit, salesCount: sales.length, rows: sales });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profit report' });
  }
});

router.get('/low-stock', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.quantity <= p.minimum_stock ORDER BY p.quantity ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch low stock' });
  }
});

export default router;
