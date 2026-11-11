import express from 'express';
import cors from 'cors';

import pool from './db';

import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import inventoryRoutes from './routes/inventory';
import customerRoutes from './routes/customers';
import saleRoutes from './routes/sales';
import purchaseRoutes from './routes/purchases';
import currencyRoutes from './routes/currencies';
import exchangeRateRoutes from './routes/exchange-rates';
import reportRoutes from './routes/reports';
import userRoutes from './routes/users';
import shopRoutes from './routes/shop';

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/exchange-rates', exchangeRateRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shop', shopRoutes);

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT DATABASE() AS database_name, NOW() AS server_time'
    );

    res.status(200).json({
      status: 'ok',
      service: 'Project Falcon API',
      database: 'connected',
      data: rows
    });

  } catch (error) {
    console.error('Database health check failed:', error);

    res.status(500).json({
      status: 'error',
      service: 'Project Falcon API',
      database: 'disconnected'
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log('================================');
  console.log('Project Falcon API Started');
  console.log(`Server running on port ${PORT}`);
  console.log('================================');
});