import pool from '../config/db.js';

/**
 * Registra un nuevo pedido gestionando cliente, teléfono y detalles
 */
export const registrarPedido = async (req, res) => {
  const { clientName, clientPhone, deliveryDate, totalAmount, items, description } = req.body;
  const usuario_id = req.user.id;
  const dbClient = await pool.connect();

  try {
    await dbClient.query('BEGIN');

    // 1. Gestión del Cliente: Busca por nombre o crea uno nuevo
    let finalClienteId;
    const nombreLimpio = clientName.trim();
    
    const checkCliente = await dbClient.query(
      "SELECT id FROM clientes WHERE UPPER(nombre_comercial) = UPPER($1) LIMIT 1",
      [nombreLimpio]
    );

    if (checkCliente.rows.length > 0) {
      finalClienteId = checkCliente.rows[0].id;
    } else {
      const nuevoCliente = await dbClient.query(
        `INSERT INTO clientes (nombre_comercial, activo, created_at, updated_at) 
         VALUES ($1, true, NOW(), NOW()) RETURNING id`,
        [nombreLimpio]
      );
      finalClienteId = nuevoCliente.rows[0].id;
    }

    // Registro o actualización de teléfono del cliente
    if (clientPhone) {
      const existeTelefono = await dbClient.query(
        "SELECT id FROM telefonos_clientes WHERE cliente_id = $1 LIMIT 1",
        [finalClienteId]
      );

      if (existeTelefono.rows.length > 0) {
        await dbClient.query(
          "UPDATE telefonos_clientes SET telefono = $1 WHERE cliente_id = $2",
          [clientPhone, finalClienteId]
        );
      } else {
        await dbClient.query(
          "INSERT INTO telefonos_clientes (cliente_id, telefono, created_at) VALUES ($1, $2, NOW())",
          [finalClienteId, clientPhone]
        );
      }
    }

    // 2. Inserción de cabecera de pedido
    const pedidoRes = await dbClient.query(
      `INSERT INTO pedidos (
        cliente_id, usuario_id, fecha_pedido, fecha_entrega, estado, total, descripcion, created_at, updated_at
      ) VALUES ($1, $2, CURRENT_DATE, $3, 1, $4, $5, NOW(), NOW()) RETURNING id`,
      [finalClienteId, usuario_id, deliveryDate, totalAmount, description || '']
    );

    const pedidoId = pedidoRes.rows[0].id;

    // 3. Inserción masiva de los detalles del pedido
    for (const item of items) {
      await dbClient.query(
        `INSERT INTO detalle_pedidos (
          pedido_id, producto_id, cantidad, alto_cm, ancho_cm, color, precio_unitario, tipo_servicio
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [pedidoId, item.productId, item.quantity, item.height, item.width, item.color, item.unitPrice, item.service]
      );
    }

    await dbClient.query('COMMIT');
    res.status(201).json({ success: true, message: "Pedido registrado correctamente", pedidoId });

  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error("ERROR REGISTRO PEDIDO:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    dbClient.release();
  }
};

/**
 * Obtiene el listado completo de pedidos con sus detalles y pagos acumulados
 */
export const obtenerTodosPedidos = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id, 
        c.nombre_comercial AS "clientName",
        tc.telefono AS "clientPhone",
        p.fecha_entrega AS "deliveryDate",
        p.created_at AS "createdAt",
        p.estado,
        p.total AS "totalAmount",
        COALESCE((SELECT SUM(monto) FROM bolsur_dbnormal.pagos WHERE pedido_id = p.id), 0) AS "totalPaid",
        p.descripcion,
        u.nombre_completo AS "createdBy",
        (
          SELECT json_agg(json_build_object(
            'id', dp.id,
            'productName', prod.nombre,
            'quantity', dp.cantidad,
            'unitPrice', dp.precio_unitario,
            'service', dp.tipo_servicio,
            'color', dp.color,
            'specifications', json_build_object(
              'height', dp.alto_cm,
              'width', dp.ancho_cm
            )
          ))
          FROM detalle_pedidos dp
          JOIN productos prod ON dp.producto_id = prod.id
          WHERE dp.pedido_id = p.id
        ) AS items
      FROM pedidos p
      JOIN clientes c ON p.cliente_id = c.id
      JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN telefonos_clientes tc ON c.id = tc.cliente_id
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query);
    
    const statusMap = { 1: 'pending', 2: 'in-progress', 3: 'finished', 4: 'delivered' };
    
    // Mapeo de resultados para formato estándar de frontend
    const pedidos = result.rows.map(row => ({
      ...row,
      orderNumber: `PED-${String(row.id).padStart(4, '0')}`,
      status: statusMap[row.estado] || 'pending',
      items: row.items || [] 
    }));

    res.json(pedidos);
  } catch (error) {
    console.error("ERROR OBTENER PEDIDOS:", error);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
};

/**
 * Obtiene el catálogo de servicios registrados
 */
export const getServicios = async (req, res) => {
  try {
    const query = `
      SELECT id_servicio AS id, nombre 
      FROM servicio 
      ORDER BY nombre ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener servicios:", err);
    res.status(500).json({ error: "Error de servidor al obtener servicios" });
  }
};

/**
 * Cambia el estado del pedido y gestiona la conversión a venta si se entrega
 */
export const actualizarEstadoPedido = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const usuario_id = req.user.id;

  const statusMap = { 'pending': 1, 'in-progress': 2, 'finished': 3, 'delivered': 4 };
  const estadoId = statusMap[status];
  const dbClient = await pool.connect();

  try {
    await dbClient.query('BEGIN');

    // Validación de existencia y bloqueo de pedidos ya entregados
    const estadoActualRes = await dbClient.query(
      "SELECT estado FROM bolsur_dbnormal.pedidos WHERE id = $1", 
      [id]
    );
    
    if (estadoActualRes.rows.length === 0) throw new Error("El pedido no existe.");
    if (estadoActualRes.rows[0].estado === 4) throw new Error("Pedido ya ENTREGADO. No se permiten cambios.");

    // Lógica para finalizar pedido y crear venta
    if (status === 'delivered') {
      // Verificación de liquidación del saldo
      const saldoRes = await dbClient.query(
        `SELECT p.total, p.cliente_id, COALESCE(SUM(pa.monto), 0) as abonado
         FROM bolsur_dbnormal.pedidos p
         LEFT JOIN bolsur_dbnormal.pagos pa ON p.id = pa.pedido_id
         WHERE p.id = $1
         GROUP BY p.total, p.cliente_id`,
        [id]
      );

      const { total, abonado, cliente_id } = saldoRes.rows[0];
      
      if (parseFloat(abonado) < parseFloat(total) - 0.01) {
        throw new Error(`Saldo insuficiente ($${abonado} de $${total}). Debe estar liquidado.`);
      }

      // Creación automática de factura/venta
      const numero_venta = `VNT-PED-${id}-${Date.now().toString().slice(-4)}`;
      const ventaRes = await dbClient.query(
        `INSERT INTO bolsur_dbnormal.ventas (
          numero_venta, cliente_id, usuario_id, fecha_venta, total, created_at, updated_at
        ) VALUES ($1, $2, $3, CURRENT_DATE, $4, NOW(), NOW()) RETURNING id`,
        [numero_venta, cliente_id, usuario_id, total]
      );
      const ventaId = ventaRes.rows[0].id;

      // Transferencia de detalles e impacto en inventario
      const detallesPedido = await dbClient.query(
        `SELECT producto_id, cantidad, precio_unitario, tipo_servicio 
         FROM bolsur_dbnormal.detalle_pedidos WHERE pedido_id = $1`,
        [id]
      );

      for (const item of detallesPedido.rows) {
        await dbClient.query(
          `INSERT INTO bolsur_dbnormal.detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, id_servicio) 
           VALUES ($1, $2, $3, $4, $5)`,
          [ventaId, item.producto_id, item.cantidad, item.precio_unitario, item.tipo_servicio]
        );

        const stockRes = await dbClient.query(
          `UPDATE bolsur_dbnormal.productos SET stock_actual = stock_actual - $1, updated_at = NOW()
           WHERE id = $2 AND stock_actual >= $1`,
          [item.cantidad, item.producto_id]
        );

        if (stockRes.rowCount === 0) throw new Error(`Stock insuficiente para ID: ${item.producto_id}`);
      }

      // Vinculación de pagos históricos a la venta generada
      await dbClient.query(
        "UPDATE bolsur_dbnormal.pagos SET venta_id = $1 WHERE pedido_id = $2",
        [ventaId, id]
      );
    }

    // Actualización final de estado
    await dbClient.query(
      "UPDATE bolsur_dbnormal.pedidos SET estado = $1, updated_at = NOW() WHERE id = $2",
      [estadoId, id]
    );

    await dbClient.query('COMMIT');
    res.json({ success: true, message: "Estado actualizado" });

  } catch (error) {
    await dbClient.query('ROLLBACK');
    res.status(400).json({ error: error.message });
  } finally {
    dbClient.release();
  }
};

/**
 * Elimina físicamente un pedido y sus detalles relacionados
 */
export const eliminarPedido = async (req, res) => {
  const { id } = req.params;
  const dbClient = await pool.connect();

  try {
    await dbClient.query('BEGIN');
    await dbClient.query('DELETE FROM detalle_pedidos WHERE pedido_id = $1', [id]);
    const result = await dbClient.query('DELETE FROM pedidos WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ error: "No encontrado" });
    }

    await dbClient.query('COMMIT');
    res.json({ success: true, message: "Eliminado de la base de datos" });
  } catch (error) {
    await dbClient.query('ROLLBACK');
    res.status(500).json({ error: "Error al eliminar" });
  } finally {
    dbClient.release();
  }
};

/**
 * Actualiza los datos de un pedido existente (Cliente, Fechas, Items)
 */
export const actualizarPedido = async (req, res) => {
  const { id } = req.params;
  const { clientName, clientPhone, deliveryDate, totalAmount, items, descripcion } = req.body;
  const dbClient = await pool.connect();

  try {
    await dbClient.query('BEGIN');

    const pedidoActual = await dbClient.query("SELECT cliente_id FROM pedidos WHERE id = $1", [id]);
    if (pedidoActual.rows.length === 0) throw new Error("Pedido no encontrado");
    
    const clienteId = pedidoActual.rows[0].cliente_id;

    // Actualización de datos del cliente
    await dbClient.query(
      "UPDATE clientes SET nombre_comercial = $1, updated_at = NOW() WHERE id = $2",
      [clientName.trim(), clienteId]
    );

    const existeTel = await dbClient.query("SELECT id FROM telefonos_clientes WHERE cliente_id = $1", [clienteId]);
    if (existeTel.rows.length > 0) {
      await dbClient.query("UPDATE telefonos_clientes SET telefono = $1 WHERE cliente_id = $2", [clientPhone, clienteId]);
    } else if (clientPhone) {
      await dbClient.query("INSERT INTO telefonos_clientes (cliente_id, telefono, created_at) VALUES ($1, $2, NOW())", [clienteId, clientPhone]);
    }

    // Actualización de cabecera de pedido
    await dbClient.query(
      `UPDATE pedidos SET fecha_entrega = $1, total = $2, descripcion = $3, updated_at = NOW() WHERE id = $4`,
      [deliveryDate, totalAmount, descripcion, id]
    );

    // Re-inserción de items (Borrado y carga nueva)
    await dbClient.query('DELETE FROM detalle_pedidos WHERE pedido_id = $1', [id]);

    for (const item of items) {
      let productoId = item.productId || item.producto_id;
      if (!productoId && item.productName) {
        const resProd = await dbClient.query("SELECT id FROM productos WHERE UPPER(nombre) = UPPER($1) LIMIT 1", [item.productName.trim()]);
        productoId = resProd.rows[0]?.id;
      }

      if (!productoId) continue;

      await dbClient.query(
        `INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, alto_cm, ancho_cm, color, precio_unitario, tipo_servicio) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, productoId, item.quantity, item.specifications?.height || 0, item.specifications?.width || 0, item.color || '', item.unitPrice || 0, item.service]
      );
    }

    await dbClient.query('COMMIT');
    res.json({ success: true, message: "Actualizado correctamente" });
  } catch (error) {
    await dbClient.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    dbClient.release();
  }
};