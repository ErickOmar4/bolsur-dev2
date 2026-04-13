// routes/empresa.js
import express from 'express';
import { getEmpresa, actualizarEmpresa } from '../controllers/empresaController.js';
import { verificarToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Solo usuarios con token válido pueden ver estos datos
router.get('/', verificarToken, getEmpresa);
router.put('/update', verificarToken, actualizarEmpresa);

export default router;