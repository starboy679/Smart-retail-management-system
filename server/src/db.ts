import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
});

// Test database connection
pool.getConnection()
  .then((connection) => {
    console.log('MySQL connected successfully!');
    connection.release();
  })
  .catch((error) => {
    console.error('MySQL connection failed:', error.message);
  });

export default pool;
export { pool };