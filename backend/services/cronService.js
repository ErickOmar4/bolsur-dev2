import cron from 'node-cron';
import pool from '../config/db.js';
import { enviarNotificacion } from '../utils/notificador.js';

export const initCronJobs = () => {
    // TAREA 1: Revisar Pedidos Vencidos
    // Para producción: '0 * * * *' (cada hora)
    // Para test: '*/10 * * * * *' (cada 10 segundos)
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

    // TAREA 2: Revisar Stock Bajo
    // Para producción: '0 */6 * * *' (cada 6 horas)
    // Para test: '*/10 * * * * *' (cada 10 segundos)
    cron.schedule('0 */6 * * *', async () => {
        console.log('Cron: Revisando inventario...');
        try {
            const stockBajo = await pool.query(`
                SELECT pr.nombre, u.id as usuario_id
                FROM bolsur_dbnormal.productos pr
                CROSS JOIN bolsur_dbnormal.usuarios u
                WHERE pr.stock_actual <= pr.stock_minimo
                AND NOT EXISTS (
                    SELECT 1 FROM bolsur_dbnormal.notificaciones n 
                    WHERE n.usuario_id = u.id 
                    AND n.type = 'low_stock' 
                    AND n.description LIKE '%' || pr.nombre || '%'
                    AND n.read = false
                )
            `);

            for (const item of stockBajo.rows) {
                await enviarNotificacion(
                    item.usuario_id,
                    'low_stock',
                    'Stock bajo',
                    `Producto: ${item.nombre} está por debajo del mínimo.`
                );
            }
        } catch (error) {
            console.error('Error en Cron de Stock:', error);
        }
    });
};