// controllers/dashboardController.js
import pool from "../config/db.js";

export const getDashboardStats = async (req, res) => {
    try {
        // Conteo de pedidos filtrados por estado para el mes actual
        const pedidosRes = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE estado = 1) as pendientes,
                COUNT(*) FILTER (WHERE estado = 2) as en_proceso,
                COUNT(*) FILTER (WHERE estado = 3) as terminados
            FROM bolsur_dbnormal.pedidos
            WHERE date_trunc('month', created_at) = date_trunc('month', current_date)
        `);

        // Suma de ingresos por pedidos con estado "entregado"
        const ingresosRes = await pool.query(`
            SELECT COALESCE(SUM(total), 0) as total_revenue
            FROM bolsur_dbnormal.pedidos
            WHERE estado = 4
        `);

        // Conteo de notificaciones pendientes de lectura
        const alertasRes = await pool.query(`
            SELECT COUNT(*) as total 
            FROM bolsur_dbnormal.notificaciones 
            WHERE read = false
        `);

        // Conteo de productos que han alcanzado el stock mínimo
        const stockRes = await pool.query(`
            SELECT COUNT(*) as total 
            FROM bolsur_dbnormal.productos 
            WHERE stock_actual <= stock_minimo
        `);

        const s = pedidosRes.rows[0];

        res.json({
            totalOrders: parseInt(s.total),
            pendingOrders: parseInt(s.pendientes),
            inProgressOrders: parseInt(s.en_proceso),
            finishedOrders: parseInt(s.terminados),
            totalRevenue: parseFloat(ingresosRes.rows[0].total_revenue),
            activeAlerts: parseInt(alertasRes.rows[0].total),
            lowStockCount: parseInt(stockRes.rows[0].total)
        });

    } catch (error) {
        console.error("Error obteniendo estadísticas:", error);
        res.status(500).json({ message: "Error del servidor" });
    }
};

export const getRecentOrders = async (req, res) => {
    try {
        // Obtiene los últimos 10 pedidos realizados
        const result = await pool.query(`
            SELECT 
                p.id, 
                p.id as folio,
                p.cliente_id, 
                p.total, 
                p.estado,
                p.created_at as date,
                p.descripcion
            FROM bolsur_dbnormal.pedidos p
            ORDER BY p.created_at DESC 
            LIMIT 10
        `);

        // Formatea datos para compatibilidad con el frontend
        const orders = result.rows.map(order => ({
            id: order.id.toString(),
            customer: `Cliente #${order.cliente_id}`,
            //date: new Date(order.date).toLocaleDateString('es-MX'),
            date: order.date, 
            amount: parseFloat(order.total),
            status: order.estado === 1 ? 'pending' : 
                    order.estado === 2 ? 'in-progress' : 
                    order.estado === 3 ? 'finished' : 'delivered'
        }));

        res.json(orders);
    } catch (error) {
        console.error("Error obteniendo pedidos recientes:", error);
        res.status(500).json({ message: "Error del servidor" });
    }
};

export const getOrderById = async (req, res) => {
    const { id } = req.params;
    try {
        // Obtiene detalle de pedido con joins de cliente, teléfono y usuario
        const result = await pool.query(`
            SELECT 
                p.*, 
                c.nombre_comercial as cliente_nombre,
                t.telefono as cliente_telefono,
                u.nombre_completo as creado_por_nombre
            FROM bolsur_dbnormal.pedidos p
            LEFT JOIN bolsur_dbnormal.clientes c ON p.cliente_id = c.id
            LEFT JOIN bolsur_dbnormal.telefonos_clientes t ON c.id = t.cliente_id
            LEFT JOIN bolsur_dbnormal.usuarios u ON p.usuario_id = u.id
            WHERE p.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Pedido no encontrado" });
        }

        const order = result.rows[0];
        
        // Estructura de respuesta para el detalle del pedido
        res.json({
            id: order.id,
            orderNumber: `PED-${order.id}`,
            status: order.estado === 1 ? 'pending' : 
                    order.estado === 2 ? 'in-progress' : 
                    order.estado === 3 ? 'finished' : 'delivered',
            statusId: order.estado,
            createdAt: order.created_at,
            deliveryDate: order.fecha_entrega,
            deliveredAt: order.estado === 4 ? order.updated_at : null,
            clientName: order.cliente_nombre || `Cliente #${order.cliente_id}`,
            clientPhone: order.cliente_telefono || "No registrado",
            clientEmail: "", 
            createdBy: order.creado_por_nombre || "Sistema",
            totalAmount: parseFloat(order.total),
            notes: order.descripcion,
            items: [
                {
                    id: 1,
                    productName: order.descripcion || "Servicio General",
                    quantity: 1,
                    unitPrice: parseFloat(order.total),
                    service: 'serigrafia'
                }
            ]
        });
    } catch (error) {
        console.error("Error al obtener pedido:", error);
        res.status(500).json({ message: "Error del servidor" });
    }
};