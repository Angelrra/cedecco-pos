import express from 'express';
import Supplier from '../models/Supplier.js';
import Product from '../models/Product.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Helper para obtener un valor anidado en un objeto mediante un path de texto (ej: "data.price")
const getNestedValue = (obj, path) => {
  if (!path || !obj) return undefined;
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current[key] === undefined) return undefined;
    current = current[key];
  }
  return current;
};

// @route   GET /api/suppliers
// @desc    Obtener lista de todos los proveedores
// @access  Privado
router.get('/', auth, async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener proveedores', error: error.message });
  }
});

// @route   GET /api/suppliers/:id
// @desc    Obtener detalle de un proveedor específico
// @access  Privado
router.get('/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    
    // Obtener también cantidad de productos asociados
    const productCount = await Product.countDocuments({ supplier: supplier._id });
    const supplierObj = supplier.toObject();
    supplierObj.productCount = productCount;

    res.json(supplierObj);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener detalle del proveedor', error: error.message });
  }
});

// @route   POST /api/suppliers
// @desc    Crear un nuevo proveedor
// @access  Privado (Solo Admin)
router.post('/', auth, adminOnly, async (req, res) => {
  const { name, email, phone, address, cuit, apiConfig } = req.body;

  try {
    const newSupplier = new Supplier({
      name,
      email,
      phone,
      address,
      cuit,
      apiConfig
    });

    await newSupplier.save();
    res.status(201).json(newSupplier);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el proveedor', error: error.message });
  }
});

// @route   PUT /api/suppliers/:id
// @desc    Actualizar un proveedor existente
// @access  Privado (Solo Admin)
router.put('/:id', auth, adminOnly, async (req, res) => {
  const { name, email, phone, address, cuit, apiConfig, active } = req.body;

  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    if (name !== undefined) supplier.name = name;
    if (email !== undefined) supplier.email = email;
    if (phone !== undefined) supplier.phone = phone;
    if (address !== undefined) supplier.address = address;
    if (cuit !== undefined) supplier.cuit = cuit;
    if (active !== undefined) supplier.active = active;
    
    if (apiConfig !== undefined) {
      supplier.apiConfig = {
        ...supplier.apiConfig,
        ...apiConfig
      };
    }

    await supplier.save();
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el proveedor', error: error.message });
  }
});

// @route   DELETE /api/suppliers/:id
// @desc    Eliminar un proveedor y desvincular sus productos
// @access  Privado (Solo Admin)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    // Desvincular todos los productos asociados
    await Product.updateMany({ supplier: supplier._id }, { supplier: null });

    await Supplier.deleteOne({ _id: supplier._id });
    res.json({ message: 'Proveedor eliminado y productos desvinculados correctamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el proveedor', error: error.message });
  }
});

// @route   POST /api/suppliers/:id/sync
// @desc    Ejecutar sincronización por API con los productos del proveedor
// @access  Privado (Solo Admin)
router.post('/:id/sync', auth, adminOnly, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    const { enabled, url, method, authHeader, authToken, mapping } = supplier.apiConfig;

    if (!enabled || !url) {
      return res.status(400).json({ message: 'La sincronización por API no está habilitada o la URL está vacía para este proveedor.' });
    }

    // Preparar cabeceras y parámetros
    const headers = {
      'Content-Type': 'application/json'
    };
    if (authHeader && authToken) {
      headers[authHeader] = authToken;
    }

    let rawData = null;
    try {
      const response = await fetch(url, {
        method: method || 'GET',
        headers
      });
      if (!response.ok) {
        throw new Error(`Código de estado del servidor externo: ${response.status}`);
      }
      rawData = await response.json();
    } catch (fetchErr) {
      const errMsg = `Error de red al llamar a la API del proveedor: ${fetchErr.message}`;
      supplier.apiConfig.syncLog = `[${new Date().toISOString()}] ${errMsg}`;
      await supplier.save();
      return res.status(502).json({ message: errMsg });
    }

    // Encontrar el arreglo de productos en la respuesta del API externo
    let itemsArray = null;
    if (Array.isArray(rawData)) {
      itemsArray = rawData;
    } else if (rawData && typeof rawData === 'object') {
      // Buscar la primera propiedad del objeto que sea un arreglo
      for (const key of Object.keys(rawData)) {
        if (Array.isArray(rawData[key])) {
          itemsArray = rawData[key];
          break;
        }
      }
    }

    if (!itemsArray) {
      const errMsg = 'No se encontró un listado o arreglo de productos en la respuesta JSON del proveedor.';
      supplier.apiConfig.syncLog = `[${new Date().toISOString()}] ${errMsg}`;
      await supplier.save();
      return res.status(422).json({ message: errMsg, responsePreview: rawData });
    }

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errorsList = [];

    // Procesar cada producto mapeado
    for (const item of itemsArray) {
      try {
        const code = getNestedValue(item, mapping.code);
        const name = getNestedValue(item, mapping.name) || 'Producto Importado';
        const purchasePrice = parseFloat(getNestedValue(item, mapping.purchasePrice)) || 0;
        const stock = parseInt(getNestedValue(item, mapping.stock), 10) || 0;

        if (!code) {
          errorCount++;
          continue;
        }

        // Buscar si el producto ya existe en base de datos
        let product = await Product.findOne({ code });

        if (product) {
          // Actualizar datos
          product.name = name;
          product.purchasePrice = purchasePrice;
          product.stock = stock;
          // Actualizar precio de venta aplicando un 40% de recargo estándar de mercado si el costo varió
          if (purchasePrice > 0) {
            product.salePrice = Math.round(purchasePrice * 1.4);
          }
          product.supplier = supplier._id;
          await product.save();
          updatedCount++;
        } else {
          // Crear nuevo producto en AuraStock
          const newProduct = new Product({
            code,
            name,
            purchasePrice,
            salePrice: purchasePrice > 0 ? Math.round(purchasePrice * 1.4) : 0,
            stock,
            category: 'Importado',
            supplier: supplier._id
          });
          await newProduct.save();
          createdCount++;
        }
      } catch (err) {
        errorCount++;
        errorsList.push(err.message);
      }
    }

    const logSummary = `Sincronización finalizada. Creados: ${createdCount}, Actualizados: ${updatedCount}, Errores: ${errorCount}.`;
    supplier.apiConfig.lastSync = new Date();
    supplier.apiConfig.syncLog = `[${new Date().toISOString()}] ${logSummary}${errorsList.length > 0 ? ' Errores: ' + errorsList.join(', ') : ''}`;
    await supplier.save();

    res.json({
      success: true,
      message: logSummary,
      created: createdCount,
      updated: updatedCount,
      errors: errorCount,
      log: supplier.apiConfig.syncLog
    });

  } catch (error) {
    res.status(500).json({ message: 'Error interno durante la sincronización', error: error.message });
  }
});

export default router;
