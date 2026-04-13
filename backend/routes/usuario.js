// routes/usuario.js
import express from "express";
import { actualizarPreferencias } from "../controllers/usuarioController.js";
import { verificarToken } from "../middleware/authMiddleware.js"; 

const router = express.Router();

router.patch("/preferencias", verificarToken, actualizarPreferencias);

export default router;