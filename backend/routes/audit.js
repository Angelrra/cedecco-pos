import express from 'express';
import Sale from '../models/Sale.js';
import StockLog from '../models/StockLog.js';
import CashSession from '../models/CashSession.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/audit/logs
// @desc    Obtener bitácora unificada ("testigo") de todas las acciones del sistema
// @access  Privado (Admin únicamente)
router.get('/logs', auth, adminOnly, async (req, res) => {
  try {
    // 1. Obtener ventas recientes
    const sales = await Sale.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(30);

    // 2. Obtener movimientos de stock recientes
    const stockLogs = await StockLog.find()
      .populate('product', 'name code')
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(30);

    // 3. Obtener turnos de caja recientes
    const cashSessions = await CashSession.find()
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(30);

    // 4. Unificar formatos
    const auditLogs = [];

    // Agregar ventas
    sales.forEach(sale => {
      auditLogs.push({
        _id: sale._id,
        type: 'venta',
        user: sale.user?.name || 'Sistema',
        userEmail: sale.user?.email || '',
        timestamp: sale.createdAt,
        description: `Venta registrada por un total de $${sale.total.toFixed(2)}`,
        details: {
          itemsCount: sale.items.reduce((acc, item) => acc + item.quantity, 0),
          paymentMethod: sale.paymentMethod,
          total: sale.total
        }
      });
    });

    // Agregar ajustes de stock
    stockLogs.forEach(log => {
      // Omitir logs tipo 'venta' para evitar duplicar información con el log de ventas
      if (log.type === 'venta') return;

      let desc = '';
      if (log.type === 'inicial') {
        desc = `Carga inicial de ${log.quantity} unidades del producto "${log.product?.name || 'Inactivo'}"`;
      } else if (log.quantity > 0) {
        desc = `Ingreso de +${log.quantity} unidades del producto "${log.product?.name || 'Inactivo'}"`;
      } else {
        desc = `Egreso / Ajuste de ${log.quantity} unidades del producto "${log.product?.name || 'Inactivo'}"`;
      }

      auditLogs.push({
        _id: log._id,
        type: 'stock',
        user: log.user?.name || 'Sistema',
        timestamp: log.createdAt,
        description: desc,
        details: {
          productName: log.product?.name || 'Inactivo',
          productCode: log.product?.code || '',
          quantity: log.quantity,
          type: log.type,
          reason: log.reason
        }
      });
    });

    // Agregar aperturas y cierres de caja
    cashSessions.forEach(session => {
      // Log de apertura
      auditLogs.push({
        _id: `${session._id}_open`,
        type: 'caja_apertura',
        user: session.user?.name || 'Usuario',
        timestamp: session.openedAt,
        description: `Apertura de caja realizada con saldo inicial de $${session.initialCash.toFixed(2)}`,
        details: {
          initialCash: session.initialCash
        }
      });

      // Log de cierre (si está cerrada)
      if (session.status === 'cerrada') {
        const sign = session.discrepancy >= 0 ? '+' : '';
        auditLogs.push({
          _id: `${session._id}_close`,
          type: 'caja_cierre',
          user: session.user?.name || 'Usuario',
          timestamp: session.closedAt,
          description: `Cierre de caja registrado con discrepancia de ${sign}$${session.discrepancy.toFixed(2)} (Arqueo: $${session.actualCash.toFixed(2)})`,
          details: {
            initialCash: session.initialCash,
            expectedCash: session.expectedCash,
            actualCash: session.actualCash,
            discrepancy: session.discrepancy,
            notes: session.notes
          }
        });
      }
    });

    // 5. Ordenar cronológicamente descendente
    auditLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Devolver los 50 eventos más recientes
    res.json(auditLogs.slice(0, 50));
  } catch (error) {
    res.status(500).json({ message: 'Error al generar la bitácora testigo', error: error.message });
  }
});

export default router;
