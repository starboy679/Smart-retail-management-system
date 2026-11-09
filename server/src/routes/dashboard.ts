import { Router } from 'express';
import pool from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['admin']));

router.get('/kpi', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [salesToday]: any = await pool.query(
      'SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE DATE(created_at) = ?',
      [today]
    );
    const [salesCount]: any = await pool.query(
      'SELECT COUNT(*) as count FROM sales WHERE DATE(created_at) = ?',
      [today]
    );
    const [lowStock]: any = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE quantity <= minimum_stock'
    );
    const [recentSales]: any = await pool.query(
      `SELECT s.id, s.total, c.name as customer_name, s.created_at
       FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
       ORDER BY s.created_at DESC LIMIT 5`
    );
    res.json({
      sales_today: salesToday[0].total,
      sales_count: salesCount[0].count,
      low_stock: lowStock[0].count,
      recent_sales: recentSales
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

router.get('/low-stock', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.quantity <= p.minimum_stock'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch low stock' });
  }
});

export default router;
