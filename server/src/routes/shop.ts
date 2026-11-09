import { Router } from 'express';
import pool from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM shop_settings ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) {
      await pool.query("INSERT INTO shop_settings (name) VALUES ('Project Falcon')");
      const [newRows]: any = await pool.query('SELECT * FROM shop_settings ORDER BY id DESC LIMIT 1');
      res.json(newRows[0]);
    } else {
      res.json(rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shop settings' });
  }
});

router.put('/', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const { name, address, phone, tax_number } = req.body;
    const [rows]: any = await pool.query('SELECT id FROM shop_settings ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) {
      const [result]: any = await pool.query(
        'INSERT INTO shop_settings (name, address, phone, tax_number) VALUES (?, ?, ?, ?)',
        [name, address, phone, tax_number]
      );
      res.json({ id: result.insertId, name, address, phone, tax_number });
    } else {
      await pool.query(
        'UPDATE shop_settings SET name = ?, address = ?, phone = ?, tax_number = ? WHERE id = ?',
        [name, address, phone, tax_number, rows[0].id]
      );
      res.json({ id: rows[0].id, name, address, phone, tax_number });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update shop settings' });
  }
});

export default router;
