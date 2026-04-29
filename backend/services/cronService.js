import cron from 'node-cron';
import pool from '../config/db.js';
import { enviarNotificacion } from '../utils/notificador.js';

// ─── Función exportada para revisar stock bajo de un producto específico ──────
// Se llama INMEDIATAMENTE desde productController cuando se crea o actualiza
// un producto, para que la notificación llegue en el acto.
export const revisarStockProducto = async (producto_id) => {
    try {
        const res = await pool.query(
            `SELECT id, nombre, stock_actual, stock_minimo
             FROM bolsur_dbnormal.productos
             WHERE id = $1 AND activo = true`,
            [producto_id]
        );
        if (res.rows.length === 0) return;
        const pr = res.rows[0];

        if (pr.stock_actual <= pr.stock_minimo) {
            await _generarNotificacionesStockBajo([pr]);
        }
    } catch (error) {
        console.error('Error al revisar stock de producto:', error);
    }
};

// ─── Lógica interna: genera notificaciones y limpia las antiguas ──────────────
const _generarNotificacionesStockBajo = async (productos) => {
    // Obtener todos los usuarios activos
    const usuariosRes = await pool.query(
        `SELECT u.id as usuario_id
         FROM bolsur_dbnormal.usuarios u
         INNER JOIN bolsur_dbnormal.usuario_preferencias p ON p.usuario_id = u.id
         WHERE p.notif_stock_bajo = true`
    );

    for (const pr of productos) {
        for (const { usuario_id } of usuariosRes.rows) {
            // FIX: Eliminar notificaciones antiguas no leídas del mismo producto
            // antes de insertar una nueva, para que no se acumulen.
            await pool.query(
                `DELETE FROM bolsur_dbnormal.notificaciones
                 WHERE usuario_id = $1
                   AND type = 'low_stock'
                   AND description LIKE '%#' || $2 || '%'
                   AND read = false`,
                [usuario_id, pr.id]
            );

            // Insertar la notificación actualizada
            await pool.query(
                `INSERT INTO bolsur_dbnormal.notificaciones (usuario_id, type, title, description)
                 VALUES ($1, 'low_stock', 'Stock bajo', $2)`,
                [
                    usuario_id,
                    `Producto #${pr.id} "${pr.nombre}" tiene stock bajo (${pr.stock_actual}/${pr.stock_minimo}).`
                ]
            );
        }
    }
};

// ─── Cron jobs ────────────────────────────────────────────────────────────────
export const initCronJobs = () => {

    // TAREA 1: Revisar Pedidos Vencidos (cada hora)
    cron.schedule('0 * * * *', async () => {
        console.log('Cron: Revisando pedidos vencidos...');
        try {
            const pedidosVencidos = await pool.query(`
                SELECT p.id, u.id as usuario_id
                FROM bolsur_dbnormal.pedidos p
                CROSS JOIN bolsur_dbnormal.usuarios u
                WHERE p.fecha_entrega < CURRENT_DATE
                AND p.estado != 4
                AND NOT EXISTS (
                    SELECT 1 FROM bolsur_dbnormal.notificaciones n
                    WHERE n.usuario_id = u.id
                    AND n.type = 'overdue'
                    AND n.description LIKE '%' || p.id || '%'
                    AND n.read = false
                )
            `);

            for (const pedido of pedidosVencidos.rows) {
                await enviarNotificacion(
                    pedido.usuario_id,
                    'overdue',
                    'Pedido vencido',
                    `El pedido #${pedido.id} ha pasado su fecha de entrega.`
                );
            }
        } catch (error) {
            console.error('Error en Cron de Pedidos:', error);
        }
    });

    // TAREA 2: Revisión periódica de stock bajo (cada 15 min)
    // Para cualquier producto que haya bajado de stock_minimo
    // y cuya notificación previa ya haya sido leída o no exista.
    cron.schedule('*/15 * * * *', async () => {
        console.log('Cron: Revisando inventario...');
        try {
            // Solo productos que NO tengan ya una notificación no leída reciente
            const stockBajo = await pool.query(`
                SELECT pr.id, pr.nombre, pr.stock_actual, pr.stock_minimo
                FROM bolsur_dbnormal.productos pr
                WHERE pr.activo = true
                  AND pr.stock_actual <= pr.stock_minimo
                  AND NOT EXISTS (
                    SELECT 1 FROM bolsur_dbnormal.notificaciones n
                    WHERE n.type = 'low_stock'
                    AND n.description LIKE '%#' || pr.id || '%'
                    AND n.read = false
                    AND n.created_at > NOW() - INTERVAL '15 minutes'
                  )
            `);

            if (stockBajo.rows.length > 0) {
                await _generarNotificacionesStockBajo(stockBajo.rows);
                console.log(`Cron: ${stockBajo.rows.length} productos con stock bajo procesados.`);
            }
        } catch (error) {
            console.error('Error en Cron de Stock:', error);
        }
    });
};