import pool from './db';
import bcrypt from 'bcryptjs';

async function seed() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query('DELETE FROM inventory_movements');
    await conn.query('DELETE FROM exchange_rates');
    await conn.query('DELETE FROM currencies');
    await conn.query('DELETE FROM sale_items');
    await conn.query('DELETE FROM sales');
    await conn.query('DELETE FROM purchase_items');
    await conn.query('DELETE FROM purchases');
    await conn.query('DELETE FROM products');
    await conn.query('DELETE FROM categories');
    await conn.query('DELETE FROM customers');
    await conn.query('DELETE FROM shop_settings');
    await conn.query('DELETE FROM users');

    const hash = await bcrypt.hash('admin123', 10);
    await conn.query(
      `INSERT INTO users (id, name, email, password_hash, role) VALUES (1, 'أحمد مصطفى', 'admin@falcon.com', ?, 'admin')`,
      [hash]
    );

    await conn.query(`INSERT INTO shop_settings (name, address, phone) VALUES ('Project Falcon', 'شارع النيل، الخرطوم، السودان', '0123456789')`);

    await conn.query(`INSERT INTO categories (id, name) VALUES (1, 'قطع المحرك'), (2, 'نظام الفرامل'), (3, 'الكهرباء'), (4, 'أخرى')`);

    await conn.query(`INSERT INTO products (id, category_id, name, sku, purchase_price, selling_price, quantity, minimum_stock) VALUES
      (1, 1, 'فلتر زيت تويوتا', 'FLT-001', 120, 180, 3, 5),
      (2, 2, 'تيل فرامل بوش', 'BRK-002', 85, 140, 45, 10),
      (3, 3, 'بوجيهات NGK', 'SPK-003', 35, 65, 120, 20),
      (4, 1, 'سير كاتينة كيا', 'BEL-004', 220, 380, 28, 8),
      (5, 4, 'فلتر هواء', 'AIR-005', 45, 85, 65, 15),
      (6, 1, 'زيت محرك 5W-30', 'OIL-006', 55, 95, 200, 30),
      (7, 4, 'صدمة أمامية', 'SHK-007', 450, 750, 12, 5),
      (8, 4, 'إطارات', 'TIR-008', 300, 520, 80, 20)`);

    await conn.query(`INSERT INTO customers (id, name, phone) VALUES (1, 'شركة النيل أوتو', '01098765432'), (2, 'ورشة أحمد', '01122334455')`);

    await conn.query(`INSERT INTO currencies (id, code, name, symbol) VALUES (1, 'SDG', 'الجنيه السوداني', 'ج.س'), (2, 'EGP', 'الجنيه المصري', 'ج.م'), (3, 'USD', 'الدولار الأمريكي', '$'), (4, 'SAR', 'الريال السعودي', 'ر.س'), (5, 'AED', 'الدرهم الإماراتي', 'د.إ')`);

    await conn.query(`INSERT INTO exchange_rates (currency_id, rate) VALUES (1, 1.0), (2, 25.0), (3, 600.0), (4, 160.0), (5, 164.0)`);

    await conn.query(`INSERT INTO sales (id, invoice_number, customer_id, subtotal, discount, total, user_id) VALUES (1, 'INV-250820-120001-001', 1, 2000, 150, 1850, 1)`);
    await conn.query(`INSERT INTO sale_items (sale_id, product_id, quantity, price, currency, exchange_rate, unit_price, unit_price_sdg, unit_cost_sdg) VALUES
      (1, 1, 5, 180, 'SDG', 1, 180, 180, 120),
      (1, 2, 3, 140, 'SDG', 1, 140, 140, 85)`);

    await conn.query(`INSERT INTO purchases (id, invoice_number, total, currency, exchange_rate, user_id) VALUES (1, 'PRC-250820-120001-001', 35000, 'SDG', 1, 1)`);
    await conn.query(`INSERT INTO purchase_items (purchase_id, product_id, quantity, purchase_price) VALUES (1, 6, 100, 55), (1, 3, 50, 35)`);

    await conn.commit();
    console.log('Database seeded successfully!');
  } catch (err) {
    await conn.rollback();
    console.error('Seed failed:', err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
