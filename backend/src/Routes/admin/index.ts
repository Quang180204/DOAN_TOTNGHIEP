import express from 'express';
import AuthRoutes from './AuthRoutes';
import DashboardRoutes from './DashboardRoutes';
import BrandsRoutes from './BrandsRoutes';
import GenresRoutes from './GenresRoutes';
import DiscountsRoutes from './DiscountsRoutes';
import ProductsRoutes from './ProductsRoutes';
import OrdersRoutes from './OrdersRoutes';
import FeedbacksRoutes from './FeedbacksRoutes';
import ContactsRoutes from './ContactsRoutes';

const router = express.Router();

router.use('/auth', AuthRoutes);
router.use('/dashboard', DashboardRoutes);
router.use('/brands', BrandsRoutes);
router.use('/genres', GenresRoutes);
router.use('/discounts', DiscountsRoutes);
router.use('/products', ProductsRoutes);
router.use('/orders', OrdersRoutes);
router.use('/feedbacks', FeedbacksRoutes);
router.use('/contacts', ContactsRoutes);

export default router;
