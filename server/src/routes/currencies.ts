import { Router } from 'express';
import pool from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['admin']));

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM currencies ORDER BY code');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch currencies' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { code, name, symbol } = req.body;
    const [result]: any = await pool.query(
      'INSERT INTO currencies (code, name, symbol) VALUES (?, ?, ?)',
      [code, name, symbol]
    );
    res.json({ id: result.insertId, code, name, symbol });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create currency' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { code, name, symbol } = req.body;
    await pool.query(
      'UPDATE currencies SET code = ?, name = ?, symbol = ? WHERE id = ?',
      [code, name, symbol, req.params.id]
    );
    res.json({ id: req.params.id, code, name, symbol });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update currency' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM exchange_rates WHERE currency_id = ?', [req.params.id]);
    await pool.query('DELETE FROM currencies WHERE id = ?', [req.params.id]);
    res.json({ message: 'Currency deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete currency' });
  }
});

export default router;
