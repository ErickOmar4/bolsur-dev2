// routes/productos.js
import express from 'express';
import { getProductosDisponibles,getInventarioCompleto, desactivarProducto, crearProducto, actualizarProducto} from '../controllers/productController.js';
import { verificarToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/disponibles', verificarToken, getProductosDisponibles);
router.get('/inventario', verificarToken, getInventarioCompleto);
router.patch('/:id/desactivar', verificarToken, desactivarProducto);
router.post('/', verificarToken, crearProducto);
router.put('/:id', verificarToken, actualizarProducto);

export default router;