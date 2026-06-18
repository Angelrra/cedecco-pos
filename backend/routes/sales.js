import express from 'express';
import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import StockLog from '../models/StockLog.js';
import CashSession from '../models/CashSession.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/sales
// @desc    Crear una nueva venta en el punto de venta
// @access  Privado (Admin y Vendedor)
router.post('/', auth, async (req, res) => {
  const { items, discount, paymentMethod, cashReceived, changeGiven } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'La venta debe contener al menos un producto' });
  }

  try {
    // 0. Validar que el usuario tenga una sesión de caja abierta activa
    const activeSession = await CashSession.findOne({ user: req.user._id, status: 'abierta' });
    if (!activeSession) {
      return res.status(400).json({ message: 'Operación denegada: Debes abrir la caja registradora antes de realizar ventas.' });
    }

    // 1. Validar todos los productos en stock y fecha de vencimiento
    const preparedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.active) {
        return res.status(404).json({ message: `El producto con ID ${item.productId} no existe o no está activo` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}` 
        });
      }

      // Alerta si el producto está vencido (consumible)
      if (product.expirationDate && product.expirationDate < new Date()) {
        // Permitimos la venta pero informamos en logs o retornamos aviso si lo requiere, 
        // para consumibles lo ideal es advertir o bloquear. Bloquearemos para mayor seguridad de salud.
        return res.status(400).json({
          message: `El producto ${product.name} está VENCIDO (Fecha de vencimiento: ${product.expirationDate.toLocaleDateString()}). Venta rechazada.`
        });
      }

      const itemSubtotal = product.salePrice * item.quantity;
      subtotal += itemSubtotal;

      preparedItems.push({
        product: product._id,
        name: product.name,
        code: product.code,
        quantity: item.quantity,
        purchasePrice: product.purchasePrice,
        salePrice: product.salePrice
      });
    }

    // Calcular total final aplicando descuento
    const discAmount = parseFloat(discount) || 0;
    const total = Math.max(0, subtotal - discAmount);

    // 2. Ejecutar decremento de stock y registro en logs
    const completedItemsLogs = [];
    
    for (const preparedItem of preparedItems) {
      const product = await Product.findById(preparedItem.product);
      product.stock -= preparedItem.quantity;
      await product.save();

      // Guardar registro de stock
      const stockLog = new StockLog({
        product: product._id,
        user: req.user._id,
        type: 'venta',
        quantity: -preparedItem.quantity,
        stockAfter: product.stock,
        reason: `Venta POS`
      });
      await stockLog.save();
    }

    // 3. Registrar la venta
    const newSale = new Sale({
      user: req.user._id,
      items: preparedItems,
      subtotal,
      discount: discAmount,
      total,
      paymentMethod: paymentMethod || 'efectivo',
      cashReceived: parseFloat(cashReceived) || 0,
      changeGiven: parseFloat(changeGiven) || 0
    });

    await newSale.save();

    // 4. Si el pago fue en efectivo, sumamos al saldo esperado de la caja abierta
    if (newSale.paymentMethod === 'efectivo') {
      activeSession.expectedCash += newSale.total;
      await activeSession.save();
    }

    // Actualizar la venta para poder devolver los datos poblados del vendedor
    const populatedSale = await Sale.findById(newSale._id).populate('user', 'name email');

    res.status(201).json({
      message: 'Venta registrada con éxito',
      sale: populatedSale
    });
  } catch (error) {
    res.status(500).json({ message: 'Error procesando la venta', error: error.message });
  }
});

// @route   GET /api/sales
// @desc    Obtener historial de ventas con filtros de fecha y cajero
// @access  Privado (Vendedor y Admin)
router.get('/', auth, async (req, res) => {
  const { startDate, endDate, sellerId, paymentMethod } = req.query;
  let query = {};

  // Filtro por fecha
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      // Ajustar fin del día a las 23:59:59
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  // Filtro por vendedor/cajero
  if (sellerId) {
    query.user = sellerId;
  }

  // Filtro por método de pago
  if (paymentMethod) {
    query.paymentMethod = paymentMethod;
  }

  try {
    const sales = await Sale.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener historial de ventas', error: error.message });
  }
});

// @route   GET /api/sales/:id
// @desc    Obtener detalles de una venta específica
// @access  Privado
router.get('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name code category');

    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener detalles de la venta', error: error.message });
  }
});

export default router;
