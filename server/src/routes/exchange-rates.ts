import { Router } from 'express';
import pool from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, er.rate, er.created_at as rate_updated
       FROM currencies c
       LEFT JOIN exchange_rates er ON er.id = (
         SELECT id FROM exchange_rates WHERE currency_id = c.id ORDER BY created_at DESC LIMIT 1
       )
       ORDER BY c.code`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});

router.get('/latest/:currencyId', async (req, res) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM exchange_rates WHERE currency_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.params.currencyId]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch latest rate' });
  }
});

router.get('/history/:currencyId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM exchange_rates WHERE currency_id = ? ORDER BY created_at DESC',
      [req.params.currencyId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rate history' });
  }
});

router.post('/',requireRole(['admin']), async (req, res) => {
  try {
    const { currency_id, rate } = req.body;
    const [result]: any = await pool.query(
      'INSERT INTO exchange_rates (currency_id, rate) VALUES (?, ?)',
      [currency_id, rate]
    );
    res.json({ id: result.insertId, currency_id, rate });
  } catch (err) {
    res.status(500).json({ error: 'Failed to set exchange rate' });
  }
});

export default router;
