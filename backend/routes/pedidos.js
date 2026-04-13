// routes/pedidos.js
import { Router } from 'express';
import { registrarPedido, getServicios, obtenerTodosPedidos, actualizarEstadoPedido, eliminarPedido, actualizarPedido} from '../controllers/pedidoController.js';
import { verificarToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', verificarToken, registrarPedido);
router.get('/servicios', verificarToken, getServicios);
router.get('/', verificarToken, obtenerTodosPedidos);
router.patch('/:id/estado', verificarToken, actualizarEstadoPedido);
router.delete('/:id', verificarToken, eliminarPedido);
router.put('/:id', verificarToken, actualizarPedido);

export default router;