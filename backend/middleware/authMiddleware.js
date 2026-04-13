// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

export const verificarToken = (req, res, next) => {
  // Extrae el token del encabezado Authorization (formato 'Bearer TOKEN')
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: "No se proporcionó un token de acceso" });
  }

  try {
    // Validación del JWT mediante la clave secreta del entorno
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Inyecta los datos del usuario decodificados en el objeto request
    req.user = decoded;
    next();
  } catch (error) {
    // Manejo de errores para tokens manipulados, mal formados o caducados
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};