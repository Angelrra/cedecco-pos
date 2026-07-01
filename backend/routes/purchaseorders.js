import express from 'express';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Product from '../models/Product.js';
import StockLog from '../models/StockLog.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/purchaseorders - Obtener todas las órdenes de compra
router.get('/', auth, async (req, res) => {
  try {
    const { supplier, status } = req.query;
    let query = {};
    if (supplier) query.supplier = supplier;
    if (status) query.status = status;

    const orders = await PurchaseOrder.find(query)
      .populate('supplier', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener órdenes de compra', error: err.message });
  }
});

// GET /api/purchaseorders/:id - Obtener una orden de compra por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id)
      .populate('supplier', 'name email phone')
      .populate('createdBy', 'name')
      .populate('items.product', 'name code stock minStock');
    if (!order) return res.status(404).json({ message: 'Orden de compra no encontrada' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
});

// POST /api/purchaseorders - Crear una nueva orden de compra
router.post('/', auth, async (req, res) => {
  try {
    const { supplier, items, notes, expectedDate, exchangeRate } = req.body;
    if (!supplier) return res.status(400).json({ message: 'El proveedor es requerido' });
    if (!items || items.length === 0) return res.status(400).json({ message: 'Debe ingresar al menos un producto' });

    // Preparar items con nombres y códigos correctos
    const preparedItems = [];
    for (const item of items) {
      const prod = await Product.findById(item.product);
      if (!prod) return res.status(404).json({ message: `Producto no encontrado: ${item.product}` });
      preparedItems.push({
        product: prod._id,
        name: prod.name,
        code: prod.code,
        quantityOrdered: parseInt(item.quantityOrdered) || 1,
        quantityReceived: 0,
        unitCost: parseFloat(item.unitCost) || 0
      });
    }

    const newOrder = new PurchaseOrder({
      supplier,
      items: preparedItems,
      notes,
      expectedDate: expectedDate || null,
      exchangeRate: exchangeRate ? parseFloat(exchangeRate) : null,
      createdBy: req.user._id,
      status: 'borrador'
    });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear orden de compra', error: err.message });
  }
});

// PUT /api/purchaseorders/:id - Actualizar orden de compra
router.put('/:id', auth, async (req, res) => {
  try {
    const { supplier, items, notes, expectedDate, status, exchangeRate } = req.body;
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Orden de compra no encontrada' });

    if (order.status === 'recibida' || order.status === 'cancelada') {
      return res.status(400).json({ message: 'No se puede modificar una orden que ya fue recibida o cancelada' });
    }

    if (notes !== undefined) order.notes = notes;
    if (expectedDate !== undefined) order.expectedDate = expectedDate;
    if (status !== undefined) order.status = status;
    if (supplier !== undefined) order.supplier = supplier;
    if (exchangeRate !== undefined) order.exchangeRate = exchangeRate ? parseFloat(exchangeRate) : null;

    if (items !== undefined) {
      const preparedItems = [];
      for (const item of items) {
        const prod = await Product.findById(item.product);
        if (!prod) return res.status(404).json({ message: `Producto no encontrado: ${item.product}` });
        preparedItems.push({
          product: prod._id,
          name: prod.name,
          code: prod.code,
          quantityOrdered: parseInt(item.quantityOrdered) || 1,
          quantityReceived: parseInt(item.quantityReceived) || 0,
          unitCost: parseFloat(item.unitCost) || 0
        });
      }
      order.items = preparedItems;
    }

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar orden de compra', error: err.message });
  }
});

// PUT /api/purchaseorders/:id/receive - Recibir mercadería (Actualizar stock y finalizar orden)
router.put('/:id/receive', auth, async (req, res) => {
  try {
    const { itemsReceived } = req.body; // Array de { product: id, quantityReceived: n }
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Orden de compra no encontrada' });

    if (order.status !== 'borrador' && order.status !== 'enviada') {
      return res.status(400).json({ message: 'Esta orden de compra ya fue finalizada o cancelada' });
    }

    // Actualizar cantidades recibidas
    if (itemsReceived && itemsReceived.length > 0) {
      for (const rx of itemsReceived) {
        const item = order.items.find(i => i.product.toString() === rx.product.toString());
        if (item) {
          item.quantityReceived = parseInt(rx.quantityReceived) || 0;
        }
      }
    } else {
      // Si no viene cantidad personalizada, asumimos que se recibió todo al 100%
      for (const item of order.items) {
        item.quantityReceived = item.quantityOrdered;
      }
    }

    // Actualizar stock de productos e ingresar al StockLog
    for (const item of order.items) {
      if (item.quantityReceived > 0) {
        const prod = await Product.findById(item.product);
        if (prod) {
          prod.stock += item.quantityReceived;
          if (item.unitCost > 0) {
            prod.purchasePrice = item.unitCost;
          }
          await prod.save();

          // Crear StockLog
          const log = new StockLog({
            product: prod._id,
            user: req.user._id,
            type: 'compra',
            quantity: item.quantityReceived,
            stockAfter: prod.stock,
            reason: `Recepción Orden de Compra #${order._id.toString().substring(18)}`
          });
          await log.save();
        }
      }
    }

    order.status = 'recibida';
    order.receivedDate = new Date();
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error al recibir la orden de compra', error: err.message });
  }
});

export default router;
