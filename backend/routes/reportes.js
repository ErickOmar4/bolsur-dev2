// routes/reportes.js
import express from 'express';
const router = express.Router();
import { getDashboardStats, generarReportePedidosPDF, generarReporteVentasPDF, generarReporteInventarioPDF } from '../controllers/reporteController.js';
import { verificarToken } from '../middleware/authMiddleware.js';

router.get('/dashboard', verificarToken, getDashboardStats);
router.get('/pdf/pedidos', verificarToken, generarReportePedidosPDF);
router.get('/pdf/ventas', verificarToken, generarReporteVentasPDF);
router.get('/pdf/inventario', verificarToken, generarReporteInventarioPDF);

export default router;