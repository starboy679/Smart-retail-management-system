import { Router } from 'express';
import pool from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/', requireRole(['admin', 'inventory_manager']), async (req, res) => {
  try {
    const { category_id, name, sku, purchase_price, selling_price, quantity, minimum_stock } = req.body;
    const [result]: any = await pool.query(
      'INSERT INTO products (category_id, name, sku, purchase_price, selling_price, quantity, minimum_stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [category_id, name, sku, purchase_price, selling_price, quantity, minimum_stock]
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', requireRole(['admin', 'inventory_manager']), async (req, res) => {
  try {
    const { category_id, name, sku, purchase_price, selling_price, quantity, minimum_stock } = req.body;
    await pool.query(
      'UPDATE products SET category_id=?, name=?, sku=?, purchase_price=?, selling_price=?, quantity=?, minimum_stock=? WHERE id=?',
      [category_id, name, sku, purchase_price, selling_price, quantity, minimum_stock, req.params.id]
    );
    res.json({ id: req.params.id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', requireRole(['admin', 'inventory_manager']), async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
