import { Router } from 'express';
import pool from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['admin', 'cashier']));

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone } = req.body;
    const [result]: any = await pool.query(
      'INSERT INTO customers (name, phone) VALUES (?, ?)',
      [name, phone]
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, phone } = req.body;
    await pool.query('UPDATE customers SET name = ?, phone = ? WHERE id = ?', [name, phone, req.params.id]);
    res.json({ id: req.params.id, name, phone });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

router.get('/:id/sales', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, u.name as user_name
       FROM sales s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.customer_id = ?
       ORDER BY s.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer sales' });
  }
});

export default router;
