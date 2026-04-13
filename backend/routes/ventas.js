// routes/ventas.js
import express from 'express';
import { registrarVenta } from '../controllers/ventaController.js'
import { obtenerVentaPorId } from '../controllers/ventaController.js';
import { obtenerTodasVentas } from '../controllers/ventaController.js';
import { verificarToken } from '../middleware/authMiddleware.js';
import { enviarTicketEmail } from '../controllers/ventaController.js';

const router = express.Router();

router.post('/', verificarToken, registrarVenta);
router.get('/:id', verificarToken, obtenerVentaPorId);
router.get('/', verificarToken, obtenerTodasVentas);
router.post('/enviar-ticket', verificarToken, enviarTicketEmail);

export default router;