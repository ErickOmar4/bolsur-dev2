// routes/notificaciones.js
import express from 'express';
import { 
    getNotificaciones, 
    marcarTodasLeidas 
} from '../controllers/notificacionController.js';
import { verificarToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas de notificaciones requieren estar logueado
router.use(verificarToken);
router.get('/', getNotificaciones);
router.put('/read-all', marcarTodasLeidas);

export default router;