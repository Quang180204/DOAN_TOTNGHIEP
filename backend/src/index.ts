import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Client routes
import AccountRoutes from './Routes/client/AccountRoutes';
import CartRoutes from './Routes/client/CartRoutes';
import HomeRoutes from './Routes/client/HomeRoutes';
import ProductsRoutes from './Routes/client/ProductsRoutes';
import OrdersRoutes from './Routes/client/OrdersRoutes';
import LocationRoutes from './Routes/client/LocationRoutes';
import AddressRoutes from './Routes/client/AddressRoutes';
import ContactRoutes from './Routes/client/ContactRoutes';
import NewsletterRoutes from './Routes/client/NewsletterRoutes';
import WishlistRoutes from './Routes/client/WishlistRoutes';
import ChatbotRoutes from './Routes/client/ChatbotRoutes';

// Admin routes
import AdminRoutes from './Routes/admin';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

// Client API (cho người dùng)
app.use('/api/account', AccountRoutes);
app.use('/api/cart', CartRoutes);
app.use('/api/home', HomeRoutes);
app.use('/api/products', ProductsRoutes);
app.use('/api/orders', OrdersRoutes);
app.use('/api/location', LocationRoutes);
app.use('/api/address', AddressRoutes);
app.use('/api/contact', ContactRoutes);
app.use('/api/newsletter', NewsletterRoutes);
app.use('/api/wishlist', WishlistRoutes);
app.use('/api/chatbot', ChatbotRoutes);

// Admin API (cho quản trị viên) - prefix /api/admin
app.use('/api/admin', AdminRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'API RUNNING',
    clientApi: '/api',
    adminApi: '/api/admin'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📱 Client API: http://localhost:${PORT}/api`);
  console.log(`👑 Admin API: http://localhost:${PORT}/api/admin`);
});
