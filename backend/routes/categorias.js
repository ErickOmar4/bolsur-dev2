// routes/categorias.js
import { Router } from 'express';
import { getCategorias } from '../controllers/categoriaController.js';
import { verificarToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', verificarToken, getCategorias);

export default router;