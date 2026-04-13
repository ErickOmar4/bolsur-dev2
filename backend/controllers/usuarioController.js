// controllers/usuarioController.js
import pool from "../config/db.js";

export const actualizarPreferencias = async (req, res) => {
  const usuario_id = req.user.id; 

  // Datos provenientes del formulario de configuración (SettingsPage)
  const { 
    nombre_completo, 
    email, 
    notif_pedidos_urgentes, 
    notif_stock_bajo, 
    notif_nuevos_pedidos, 
    imprimir_automatico, 
    enviar_correo_cliente 
  } = req.body;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Actualiza información básica de la cuenta del usuario
    await client.query(
      `UPDATE bolsur_dbnormal.usuarios 
       SET nombre_completo = $1, email = $2 
       WHERE id = $3`,
      [nombre_completo, email, usuario_id]
    );

    // Actualiza los ajustes personalizados de notificaciones y automatización
    await client.query(
      `UPDATE bolsur_dbnormal.usuario_preferencias 
       SET 
        notif_pedidos_urgentes = $1, 
        notif_stock_bajo = $2, 
        notif_nuevos_pedidos = $3, 
        imprimir_automatico = $4, 
        enviar_correo_cliente = $5
       WHERE usuario_id = $6`,
      [
        notif_pedidos_urgentes, 
        notif_stock_bajo, 
        notif_nuevos_pedidos, 
        imprimir_automatico, 
        enviar_correo_cliente, 
        usuario_id
      ]
    );

    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      message: "Perfil y preferencias actualizadas correctamente" 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al actualizar preferencias:", error);
    res.status(500).json({ error: "No se pudieron guardar los cambios en la base de datos" });
  } finally {
    client.release();
  }
};