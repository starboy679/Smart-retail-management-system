import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Project Falcon API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
