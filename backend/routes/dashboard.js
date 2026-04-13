// routes/dashboard.js
import express from 'express';
import { getDashboardStats, getRecentOrders, getOrderById } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/stats', getDashboardStats);
router.get('/recent-orders', getRecentOrders);
router.get('/orders/:id', getOrderById);

export default router;