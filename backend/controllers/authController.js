// controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Consulta de usuario con sus preferencias de configuración
    const result = await pool.query(
      `SELECT 
        u.id, 
        u.nombre_completo, 
        u.email, 
        u.password_hash, 
        u.rol_id, 
        u.activo,
        p.notif_pedidos_urgentes,
        p.notif_stock_bajo,
        p.notif_nuevos_pedidos,
        p.imprimir_automatico,
        p.enviar_correo_cliente
       FROM bolsur_dbnormal.usuarios u
       LEFT JOIN bolsur_dbnormal.usuario_preferencias p ON u.id = p.usuario_id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const user = result.rows[0];

    // Verificación de estado de cuenta
    if (!user.activo) {
      return res.status(403).json({ error: "Usuario inactivo" });
    }

    // Comparación de hash de contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Generación de JWT con expiración de 8 horas
    const token = jwt.sign(
      { id: user.id, rol_id: user.rol_id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '8h' }
    );

    // Eliminación del hash antes de enviar la respuesta
    delete user.password_hash; 

    res.json({ 
      user, 
      token 
    });

  } catch (err) {
    console.error("Error en Login:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};