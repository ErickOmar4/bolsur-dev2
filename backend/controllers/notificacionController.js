import pool from "../config/db.js";

// Obtener las últimas 20 notificaciones del usuario autenticado
export const getNotificaciones = async (req, res) => {
    const usuario_id = req.user.id;
    try {
        const result = await pool.query(
            `SELECT * FROM bolsur_dbnormal.notificaciones 
             WHERE usuario_id = $1 
             ORDER BY created_at DESC LIMIT 20`,
            [usuario_id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener notificaciones" });
    }
};

// Actualizar el estado de todas las notificaciones del usuario a "leídas"
export const marcarTodasLeidas = async (req, res) => {
    const usuario_id = req.user.id;
    try {
        await pool.query(
            "UPDATE bolsur_dbnormal.notificaciones SET read = true WHERE usuario_id = $1",
            [usuario_id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar" });
    }
};

// Generar notificaciones basadas en las preferencias granulares de cada usuario
export const crearNotificacionInterna = async (usuario_id, tipo, titulo, mensaje) => {
    try {
        // Consulta las preferencias de notificación configuradas por el usuario
        const pref = await pool.query(
            "SELECT * FROM bolsur_dbnormal.usuario_preferencias WHERE usuario_id = $1",
            [usuario_id]
        );
        
        if (pref.rows.length === 0) return;

        const p = pref.rows[0];
        let debeNotificar = false;

        // Validación de tipos de alerta según configuración
        if (tipo === 'overdue' && p.notif_pedidos_urgentes) debeNotificar = true;
        if (tipo === 'low_stock' && p.notif_stock_bajo) debeNotificar = true;
        if (tipo === 'new_order' && p.notif_nuevos_pedidos) debeNotificar = true;
        if (tipo === 'delivered') debeNotificar = true; 

        // Inserción en tabla de notificaciones si la preferencia está activa
        if (debeNotificar) {
            await pool.query(
                `INSERT INTO bolsur_dbnormal.notificaciones (usuario_id, type, title, description) 
                 VALUES ($1, $2, $3, $4)`,
                [usuario_id, tipo, titulo, mensaje]
            );
        }
    } catch (error) {
        console.error("Error silencioso en notificaciones:", error);
    }
};