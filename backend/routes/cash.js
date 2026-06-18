import express from 'express';
import CashSession from '../models/CashSession.js';
import Sale from '../models/Sale.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/cash/current
// @desc    Obtener sesión de caja abierta activa del usuario
// @access  Privado (Cajero y Admin)
router.get('/current', auth, async (req, res) => {
  try {
    const session = await CashSession.findOne({ user: req.user._id, status: 'abierta' });
    if (!session) {
      return res.json(null);
    }

    // Calcular ventas del turno dinámicamente
    const sales = await Sale.find({
      user: req.user._id,
      createdAt: { $gte: session.openedAt }
    });

    let salesCash = 0;
    let salesCard = 0;
    let salesTransfer = 0;
    let salesMercadoPago = 0;

    sales.forEach(sale => {
      if (sale.paymentMethod === 'efectivo') {
        salesCash += sale.total;
      } else if (sale.paymentMethod === 'tarjeta') {
        salesCard += sale.total;
      } else if (sale.paymentMethod === 'transferencia') {
        salesTransfer += sale.total;
      } else if (sale.paymentMethod === 'mercadopago') {
        salesMercadoPago += sale.total;
      }
    });

    const sessionObj = session.toObject();

    // Arqueo Ciego: Solo el administrador tiene visibilidad de los montos esperados y ventas en tiempo real
    if (req.user.role === 'admin') {
      sessionObj.expectedCash = session.initialCash + salesCash;
      sessionObj.expectedCard = salesCard;
      sessionObj.expectedTransfer = salesTransfer;
      sessionObj.expectedMercadoPago = salesMercadoPago;
      sessionObj.salesCash = salesCash;
      sessionObj.salesCard = salesCard;
      sessionObj.salesTransfer = salesTransfer;
      sessionObj.salesMercadoPago = salesMercadoPago;
      sessionObj.totalSales = salesCash + salesCard + salesTransfer + salesMercadoPago;
    } else {
      // Para vendedores, ocultamos los valores esperados
      sessionObj.expectedCash = null;
      sessionObj.expectedCard = null;
      sessionObj.expectedTransfer = null;
      sessionObj.expectedMercadoPago = null;
      sessionObj.salesCash = null;
      sessionObj.salesCard = null;
      sessionObj.salesTransfer = null;
      sessionObj.salesMercadoPago = null;
      sessionObj.totalSales = null;
    }

    res.json(sessionObj);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener sesión de caja', error: error.message });
  }
});

// @route   POST /api/cash/open
// @desc    Abrir caja con un monto inicial
// @access  Privado (Cajero y Admin)
router.post('/open', auth, async (req, res) => {
  const { initialCash } = req.body;

  if (initialCash === undefined || isNaN(initialCash) || parseFloat(initialCash) < 0) {
    return res.status(400).json({ message: 'El monto de apertura inicial debe ser un número positivo' });
  }

  try {
    // Validar si el usuario ya tiene una sesión abierta
    const existingSession = await CashSession.findOne({ user: req.user._id, status: 'abierta' });
    if (existingSession) {
      return res.status(400).json({ message: 'Ya tienes una sesión de caja abierta activa' });
    }

    const newSession = new CashSession({
      user: req.user._id,
      initialCash: parseFloat(initialCash),
      expectedCash: parseFloat(initialCash),
      status: 'abierta'
    });

    await newSession.save();
    res.status(201).json({ message: 'Caja abierta con éxito', session: newSession });
  } catch (error) {
    res.status(500).json({ message: 'Error al realizar la apertura de caja', error: error.message });
  }
});

// @route   POST /api/cash/close
// @desc    Cerrar caja indicando efectivo real, tarjeta real y transferencia real, registrando discrepancias individuales
// @access  Privado (Cajero y Admin)
router.post('/close', auth, async (req, res) => {
  const { actualCash, actualCard, actualTransfer, actualMercadoPago, notes } = req.body;

  if (actualCash === undefined || isNaN(actualCash) || parseFloat(actualCash) < 0) {
    return res.status(400).json({ message: 'El monto de efectivo real contado debe ser un número positivo o cero' });
  }
  if (actualCard === undefined || isNaN(actualCard) || parseFloat(actualCard) < 0) {
    return res.status(400).json({ message: 'El monto de tarjetas contado debe ser un número positivo o cero' });
  }
  if (actualTransfer === undefined || isNaN(actualTransfer) || parseFloat(actualTransfer) < 0) {
    return res.status(400).json({ message: 'El monto de transferencias contado debe ser un número positivo o cero' });
  }
  if (actualMercadoPago === undefined || isNaN(actualMercadoPago) || parseFloat(actualMercadoPago) < 0) {
    return res.status(400).json({ message: 'El monto de Mercado Pago contado debe ser un número positivo o cero' });
  }

  try {
    const session = await CashSession.findOne({ user: req.user._id, status: 'abierta' });
    if (!session) {
      return res.status(404).json({ message: 'No se encontró una sesión de caja abierta para cerrar' });
    }

    // Calcular ventas reales registradas en base de datos para esta sesión
    const sales = await Sale.find({
      user: req.user._id,
      createdAt: { $gte: session.openedAt }
    });

    let salesCash = 0;
    let salesCard = 0;
    let salesTransfer = 0;
    let salesMercadoPago = 0;

    sales.forEach(sale => {
      if (sale.paymentMethod === 'efectivo') {
        salesCash += sale.total;
      } else if (sale.paymentMethod === 'tarjeta') {
        salesCard += sale.total;
      } else if (sale.paymentMethod === 'transferencia') {
        salesTransfer += sale.total;
      } else if (sale.paymentMethod === 'mercadopago') {
        salesMercadoPago += sale.total;
      }
    });

    const expectedC = session.initialCash + salesCash;
    const expectedCr = salesCard;
    const expectedTr = salesTransfer;
    const expectedMp = salesMercadoPago;

    const actC = parseFloat(actualCash);
    const actCr = parseFloat(actualCard);
    const actTr = parseFloat(actualTransfer);
    const actMp = parseFloat(actualMercadoPago);

    session.closedAt = new Date();
    
    // Asignación de efectivo
    session.expectedCash = expectedC;
    session.actualCash = actC;
    session.discrepancy = actC - expectedC;

    // Asignación de tarjeta
    session.expectedCard = expectedCr;
    session.actualCard = actCr;
    session.discrepancyCard = actCr - expectedCr;

    // Asignación de transferencia
    session.expectedTransfer = expectedTr;
    session.actualTransfer = actTr;
    session.discrepancyTransfer = actTr - expectedTr;

    // Asignación de Mercado Pago
    session.expectedMercadoPago = expectedMp;
    session.actualMercadoPago = actMp;
    session.discrepancyMercadoPago = actMp - expectedMp;

    session.status = 'cerrada';
    if (notes) session.notes = notes;

    await session.save();
    res.json({ message: 'Caja cerrada correctamente', session });
  } catch (error) {
    res.status(500).json({ message: 'Error al realizar el cierre de caja', error: error.message });
  }
});

// @route   GET /api/cash/history
// @desc    Obtener historial completo de cierres de caja del sistema
// @access  Privado (Admin)
router.get('/history', auth, adminOnly, async (req, res) => {
  try {
    const sessions = await CashSession.find()
      .populate('user', 'name email')
      .sort({ openedAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener historial de turnos de caja', error: error.message });
  }
});

export default router;
