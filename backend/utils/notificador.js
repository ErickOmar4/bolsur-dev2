// utils/notificador.js
import pool from "../config/db.js";

export const enviarNotificacion = async (usuario_id, tipo, titulo, descripcion) => {
    try {
        // 1. Consultar preferencias del usuario
        const prefRes = await pool.query(
            "SELECT * FROM bolsur_dbnormal.usuario_preferencias WHERE usuario_id = $1",
            [usuario_id]
        );

        if (prefRes.rows.length === 0) return;
        const p = prefRes.rows[0];

        // 2. Mapear tipo de notificación con columna de preferencia
        const mapaPreferencias = {
            'overdue': p.notif_pedidos_urgentes,
            'low_stock': p.notif_stock_bajo,
            'new_order': p.notif_nuevos_pedidos,
            'delivered': true
        };

        // 3. Si el usuario tiene habilitado ese tipo, insertar
        if (mapaPreferencias[tipo]) {
            await pool.query(
                `INSERT INTO bolsur_dbnormal.notificaciones (usuario_id, type, title, description) 
                 VALUES ($1, $2, $3, $4)`,
                [usuario_id, tipo, titulo, descripcion]
            );
        }
    } catch (error) {
        console.error("Error al procesar notificación:", error);
    }
};