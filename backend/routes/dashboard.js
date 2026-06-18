import express from 'express';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Obtener estadísticas del tablero principal y analíticas
// @access  Privado (Vendedor y Admin)
router.get('/stats', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 7);

    // 1. Calcular Ventas del Día y totales acumulados
    const salesToday = await Sale.find({ createdAt: { $gte: today } });
    const revenueToday = salesToday.reduce((acc, sale) => acc + sale.total, 0);
    const transactionsToday = salesToday.length;

    // 2. Calcular alertas de stock y vencimiento
    const lowStockCount = await Product.countDocuments({
      active: true,
      $expr: { $lte: ['$stock', '$minStock'] }
    });

    const expiredCount = await Product.countDocuments({
      active: true,
      expirationDate: { $lt: new Date() }
    });

    // 3. Ventas totales y Ganancias netas totales del sistema (solo Admin puede ver ganancias completas, pero daremos soporte general)
    const allSales = await Sale.find();
    const totalRevenue = allSales.reduce((acc, sale) => acc + sale.total, 0);
    
    // Ganancia neta = Suma de (cantidad * (precioVenta - precioCompra)) - descuento
    let totalProfit = 0;
    allSales.forEach(sale => {
      let saleCost = 0;
      let saleGrossRevenue = 0;
      sale.items.forEach(item => {
        saleCost += (item.purchasePrice * item.quantity);
        saleGrossRevenue += (item.salePrice * item.quantity);
      });
      // La ganancia neta es la diferencia menos el descuento de la venta
      const netSaleProfit = saleGrossRevenue - saleCost - sale.discount;
      totalProfit += netSaleProfit;
    });

    // 4. Productos más vendidos (Top 5)
    const topProductsAgg = await Sale.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          code: { $first: '$items.code' },
          totalQty: { $sum: '$items.quantity' },
          totalSales: { $sum: { $multiply: ['$items.salePrice', '$items.quantity'] } }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 }
    ]);

    // 5. Historial de ventas de los últimos 7 días (para el gráfico)
    const salesOverTime = await Sale.aggregate([
      { $match: { createdAt: { $gte: startOfWeek } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$total" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Llenar días vacíos en el gráfico de los últimos 7 días para que se vea continuo y premium
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const match = salesOverTime.find(item => item._id === dateString);
      chartData.push({
        date: dateString,
        total: match ? match.total : 0,
        count: match ? match.count : 0,
        dayName: d.toLocaleDateString('es-ES', { weekday: 'short' })
      });
    }

    // 6. Alertas de inventario recientes (bajo stock)
    const lowStockAlerts = await Product.find({
      active: true,
      $expr: { $lte: ['$stock', '$minStock'] }
    })
      .select('name stock minStock category')
      .limit(5);

    // 7. Alertas de vencimiento próximo (próximos 30 días)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringAlerts = await Product.find({
      active: true,
      expirationDate: {
        $gte: new Date(),
        $lte: thirtyDaysFromNow
      }
    })
      .select('name stock expirationDate')
      .sort({ expirationDate: 1 })
      .limit(5);

    res.json({
      kpis: {
        revenueToday,
        transactionsToday,
        totalRevenue,
        totalProfit: Math.max(0, totalProfit),
        lowStockCount,
        expiredCount
      },
      topProducts: topProductsAgg,
      chartData,
      lowStockAlerts,
      expiringAlerts
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al generar estadísticas del panel', error: error.message });
  }
});

// @route   GET /api/dashboard/stock-history
// @desc    Obtener el registro histórico completo de movimientos de stock
// @access  Privado (Admin)
router.get('/stock-history', auth, async (req, res) => {
  try {
    const logs = await StockLog.find()
      .populate('product', 'name code')
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener historial de stock', error: error.message });
  }
});

export default router;
