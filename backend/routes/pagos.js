// routes/pagos.js
import express from 'express';
const router = express.Router();
import { 
    getMetodosPago, 
    getPagosPorPedido, 
    registrarAbono 
} from '../controllers/pagoController.js';
import { verificarToken } from '../middleware/authMiddleware.js';

router.get('/metodos-pago', verificarToken, getMetodosPago);
router.get('/:pedidoId/historial-pagos', verificarToken, getPagosPorPedido);
router.post('/registrar-pago', verificarToken, registrarAbono);

export default router;