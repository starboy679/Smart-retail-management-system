import { Router } from 'express';
import pool from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/',requireRole(['admin', 'inventory_manager', 'cashier']), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/',requireRole(['admin', 'inventory_manager', 'cashier']), async (req, res) => {
  try {
    const { name } = req.body;
    const [result]: any = await pool.query('INSERT INTO categories (name) VALUES (?)', [name]);
    res.json({ id: result.insertId, name });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/:id',requireRole(['admin', 'inventory_manager', 'cashier']), async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('UPDATE categories SET name = ? WHERE id = ?', [name, req.params.id]);
    res.json({ id: req.params.id, name });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
