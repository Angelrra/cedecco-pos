import express from 'express';
import Product from '../models/Product.js';
import StockLog from '../models/StockLog.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/products
// @desc    Obtener todos los productos con filtros y buscador
// @access  Privado (Vendedor y Admin)
router.get('/', auth, async (req, res) => {
  const { search, category, filter, limit } = req.query;
  let query = { active: true };

  // Filtro por búsqueda de texto (nombre o código)
  if (search) {
    const cleanSearch = search.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    query.$or = [
      { name: { $regex: cleanSearch, $options: 'i' } },
      { code: { $regex: cleanSearch, $options: 'i' } }
    ];
  }

  // Filtro por categoría
  if (category) {
    query.category = category;
  }

  // Filtro rápido de inventario
  if (filter === 'low-stock') {
    // Stock es menor o igual al stock mínimo
    query.$expr = { $lte: ['$stock', '$minStock'] };
  } else if (filter === 'out-of-stock') {
    query.stock = 0;
  } else if (filter === 'expired') {
    query.expirationDate = { $lt: new Date() };
  } else if (filter === 'expiring-soon') {
    // Vencimiento dentro de los próximos 30 días
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    query.expirationDate = {
      $gte: new Date(),
      $lte: thirtyDaysFromNow
    };
  }

  try {
    let productsQuery = Product.find(query).populate('supplier', 'name').sort({ name: 1 });
    
    if (limit) {
      productsQuery = productsQuery.limit(parseInt(limit));
    }

    const products = await productsQuery;
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
});

// @route   GET /api/products/categories
// @desc    Obtener lista de categorías únicas en uso
// @access  Privado
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await Product.distinct('category', { active: true });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener categorías', error: error.message });
  }
});

// @route   GET /api/products/code/:code
// @desc    Buscar producto por código de barras exacto
// @access  Privado (POS)
router.get('/code/:code', auth, async (req, res) => {
  try {
    const product = await Product.findOne({ code: req.params.code.trim(), active: true });
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar código de producto', error: error.message });
  }
});

// @route   GET /api/products/:id
// @desc    Obtener producto por ID
// @access  Privado
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('supplier', 'name email phone');
    if (!product || !product.active) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el producto', error: error.message });
  }
});

// @route   POST /api/products
// @desc    Crear un producto nuevo (o reactivar uno existente que fue dado de baja lógica)
// @access  Privado (Admin)
router.post('/', auth, async (req, res) => {
  const { code, name, description, category, purchasePrice, salePrice, stock, minStock, expirationDate, supplier } = req.body;

  try {
    // Validar si existe un producto con el mismo código
    const existingProduct = await Product.findOne({ code });
    if (existingProduct) {
      if (existingProduct.active) {
        return res.status(400).json({ message: 'Ya existe un producto activo con ese código de barras' });
      }

      // Si el producto existía pero estaba inactivo (baja lógica), lo reactivamos con los nuevos datos
      existingProduct.name = (name && name.trim()) ? name.trim() : 'Producto Sin Nombre';
      existingProduct.description = description || '';
      existingProduct.category = (category && category.trim()) ? category.trim() : 'General';
      existingProduct.purchasePrice = (isNaN(purchasePrice) || purchasePrice === '' || purchasePrice === undefined || purchasePrice === null) ? 0 : Number(purchasePrice);
      existingProduct.salePrice = (isNaN(salePrice) || salePrice === '' || salePrice === undefined || salePrice === null) ? 0 : Number(salePrice);
      existingProduct.stock = (isNaN(stock) || stock === '' || stock === undefined || stock === null) ? 0 : Number(stock);
      existingProduct.minStock = (isNaN(minStock) || minStock === '' || minStock === undefined || minStock === null) ? 0 : Number(minStock);
      existingProduct.expirationDate = expirationDate || null;
      existingProduct.supplier = supplier || null;
      existingProduct.active = true;

      await existingProduct.save();

      // Registrar en el log de stock el stock inicial de reactivación
      if (existingProduct.stock > 0) {
        const stockLog = new StockLog({
          product: existingProduct._id,
          user: req.user._id,
          type: 'inicial',
          quantity: existingProduct.stock,
          stockAfter: existingProduct.stock,
          reason: 'Reactivación y registro de stock inicial de producto'
        });
        await stockLog.save();
      }

      return res.status(201).json({ message: 'Producto creado correctamente', product: existingProduct });
    }

    const newProduct = new Product({
      code,
      name: (name && name.trim()) ? name.trim() : 'Producto Sin Nombre',
      description: description || '',
      category: (category && category.trim()) ? category.trim() : 'General',
      purchasePrice: (isNaN(purchasePrice) || purchasePrice === '' || purchasePrice === undefined || purchasePrice === null) ? 0 : Number(purchasePrice),
      salePrice: (isNaN(salePrice) || salePrice === '' || salePrice === undefined || salePrice === null) ? 0 : Number(salePrice),
      stock: (isNaN(stock) || stock === '' || stock === undefined || stock === null) ? 0 : Number(stock),
      minStock: (isNaN(minStock) || minStock === '' || minStock === undefined || minStock === null) ? 0 : Number(minStock),
      expirationDate: expirationDate || null,
      supplier: supplier || null
    });

    await newProduct.save();

    // Registrar en el log de stock el stock inicial
    if (newProduct.stock > 0) {
      const stockLog = new StockLog({
        product: newProduct._id,
        user: req.user._id,
        type: 'inicial',
        quantity: newProduct.stock,
        stockAfter: newProduct.stock,
        reason: 'Registro inicial de producto'
      });
      await stockLog.save();
    }

    res.status(201).json({ message: 'Producto creado correctamente', product: newProduct });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear producto', error: error.message });
  }
});

// @route   PUT /api/products/:id
// @desc    Actualizar un producto existente
// @access  Privado (Admin)
router.put('/:id', auth, async (req, res) => {
  const { code, name, description, category, purchasePrice, salePrice, minStock, expirationDate, supplier } = req.body;

  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.active) {
      return res.status(404).json({ message: 'Producto no encontrado o inactivo' });
    }

    // Verificar que el código de barras no colisione con otro producto (excluyendo el actual)
    if (code !== undefined) {
      if (code) {
        const codeExists = await Product.findOne({ code, _id: { $ne: product._id } });
        if (codeExists) {
          if (codeExists.active) {
            return res.status(400).json({ message: 'Ya existe otro producto activo con ese código de barras' });
          } else {
            return res.status(400).json({ message: 'Ya existe un producto eliminado en el sistema con ese código de barras. Para reactivarlo, créalo nuevamente desde el formulario de registro.' });
          }
        }
        product.code = code;
      }
    }

    if (name !== undefined) {
      product.name = (name && name.trim()) ? name.trim() : 'Producto Sin Nombre';
    }
    if (description !== undefined) {
      product.description = description || '';
    }
    if (category !== undefined) {
      product.category = (category && category.trim()) ? category.trim() : 'General';
    }
    if (purchasePrice !== undefined) {
      product.purchasePrice = (isNaN(purchasePrice) || purchasePrice === '' || purchasePrice === null) ? 0 : Number(purchasePrice);
    }
    if (salePrice !== undefined) {
      product.salePrice = (isNaN(salePrice) || salePrice === '' || salePrice === null) ? 0 : Number(salePrice);
    }
    if (minStock !== undefined) {
      product.minStock = (isNaN(minStock) || minStock === '' || minStock === null) ? 0 : Number(minStock);
    }
    if (expirationDate !== undefined) {
      product.expirationDate = expirationDate || null;
    }
    if (supplier !== undefined) {
      product.supplier = supplier || null;
    }

    await product.save();
    res.json({ message: 'Producto actualizado correctamente', product });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar producto', error: error.message });
  }
});

// @route   PUT /api/products/:id/stock
// @desc    Ajustar stock de un producto (Compra o Ajuste manual)
// @access  Privado (Vendedor y Admin)
router.put('/:id/stock', auth, async (req, res) => {
  const { quantity, type, reason } = req.body; // quantity puede ser positivo o negativo, type: 'compra', 'ajuste_positivo', 'ajuste_negativo'

  if (!quantity || isNaN(quantity)) {
    return res.status(400).json({ message: 'La cantidad debe ser un número válido distinto de cero' });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.active) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const qtyNumber = parseInt(quantity);
    const newStock = product.stock + qtyNumber;

    if (newStock < 0) {
      return res.status(400).json({ message: 'El stock resultante no puede ser negativo' });
    }

    product.stock = newStock;
    await product.save();

    // Determinar tipo de ajuste automáticamente si no se especifica
    let logType = type;
    if (!logType) {
      if (qtyNumber > 0) {
        logType = 'ajuste_positivo';
      } else {
        logType = 'ajuste_negativo';
      }
    }

    // Guardar en el historial de stock
    const stockLog = new StockLog({
      product: product._id,
      user: req.user._id,
      type: logType,
      quantity: qtyNumber,
      stockAfter: newStock,
      reason: reason || `Ajuste de stock manual de ${qtyNumber > 0 ? '+' : ''}${qtyNumber} unidades`
    });
    await stockLog.save();

    res.json({ message: 'Stock actualizado correctamente', product });
  } catch (error) {
    res.status(500).json({ message: 'Error al ajustar stock', error: error.message });
  }
});

// @route   DELETE /api/products/:id
// @desc    Desactivar un producto (Baja lógica para preservar relaciones)
// @access  Privado (Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.active) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Hacemos baja lógica
    product.active = false;
    await product.save();

    res.json({ message: 'Producto desactivado del inventario' });
  } catch (error) {
    res.status(500).json({ message: 'Error al dar de baja al producto', error: error.message });
  }
});

export default router;
