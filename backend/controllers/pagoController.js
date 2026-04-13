import pool from '../config/db.js';

// Obtiene los métodos de pago activos para la selección en el sistema
export const getMetodosPago = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, nombre, requiere_referencia FROM metodos_pago WHERE activo = true"
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener métodos de pago" });
    }
};

// Recupera el historial de transacciones vinculadas a un pedido específico
export const getPagosPorPedido = async (req, res) => {
    const { pedidoId } = req.params;
    try {
        const query = `
            SELECT p.*, m.nombre as metodo_nombre 
            FROM pagos p
            JOIN metodos_pago m ON p.metodo_pago_id = m.id
            WHERE p.pedido_id = $1
            ORDER BY p.fecha_pago DESC
        `;
        const result = await pool.query(query, [pedidoId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener historial de pagos" });
    }
};

// Registra una nueva transacción (abono o liquidación) vinculada a un pedido
export const registrarAbono = async (req, res) => {
    const { pedido_id, monto, metodo_pago_id, referencia, fecha_pago, tipo } = req.body;
    const usuario_id = req.user.id; 

    try {
        const query = `
            INSERT INTO pagos (
                pedido_id, 
                metodo_pago_id, 
                monto, 
                fecha_pago, 
                referencia, 
                usuario_registra_id, 
                fecha_registro,
                tipo
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
            RETURNING *
        `;
        
        const values = [pedido_id, metodo_pago_id, monto, fecha_pago, referencia || '', usuario_id, tipo || 'ABONO'];
        const result = await pool.query(query, values);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("ERROR AL REGISTRAR PAGO:", error);
        res.status(500).json({ error: "No se pudo registrar el abono" });
    }
};