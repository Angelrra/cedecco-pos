import express from 'express';
import PriceList from '../models/PriceList.js';
import Product from '../models/Product.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Colores predeterminados para las 6 listas
const DEFAULT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const DEFAULT_MARKUPS = [20, 30, 40, 50, 60, 100];
const DEFAULT_NAMES = ['Lista 1 - Minorista', 'Lista 2 - Mayorista', 'Lista 3 - Especial', 'Lista 4 - Distribuidor', 'Lista 5 - VIP', 'Lista 6 - Costo'];

// Asegurar que las 6 listas existen en la base de datos
const ensureLists = async () => {
  for (let i = 1; i <= 6; i++) {
    const exists = await PriceList.findOne({ index: i });
    if (!exists) {
      await PriceList.create({
        index: i,
        name: DEFAULT_NAMES[i - 1],
        description: '',
        markup: DEFAULT_MARKUPS[i - 1],
        color: DEFAULT_COLORS[i - 1],
        active: true
      });
    }
  }
};

// GET /api/pricelists — obtener las 6 listas con sus configuraciones
router.get('/', auth, async (req, res) => {
  try {
    await ensureLists();
    const lists = await PriceList.find().sort({ index: 1 });
    res.json(lists);
  } catch (error) {
    console.error('Error al obtener listas de precios:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /api/pricelists/:index — actualizar configuración de una lista (nombre, markup, color, descripción)
router.put('/:index', auth, async (req, res) => {
  try {
    const listIndex = parseInt(req.params.index);
    if (listIndex < 1 || listIndex > 6) {
      return res.status(400).json({ message: 'Índice de lista inválido (1-6)' });
    }

    const { name, description, markup, color, active } = req.body;

    const updated = await PriceList.findOneAndUpdate(
      { index: listIndex },
      { name, description, markup, color, active },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar lista de precios:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/pricelists/products — obtener todos los productos con sus precios calculados para todas las listas
router.get('/products', auth, async (req, res) => {
  try {
    await ensureLists();
    const lists = await PriceList.find().sort({ index: 1 });
    const products = await Product.find({ active: true })
      .select('code name purchasePrice salePrice customPrices category')
      .sort({ name: 1 });

    // Para cada producto, calcular el precio por lista
    const result = products.map(p => {
      const prices = {};
      lists.forEach(list => {
        const custom = p.customPrices.find(cp => cp.listIndex === list.index);
        if (custom && custom.useCustom) {
          prices[list.index] = {
            price: custom.price,
            isCustom: true
          };
        } else {
          // Precio calculado: costo * (1 + markup/100)
          const calculated = p.purchasePrice > 0
            ? Math.round(p.purchasePrice * (1 + list.markup / 100) * 100) / 100
            : p.salePrice; // fallback al precio de venta si no hay costo
          prices[list.index] = {
            price: calculated,
            isCustom: false
          };
        }
      });
      return {
        _id: p._id,
        code: p.code,
        name: p.name,
        purchasePrice: p.purchasePrice,
        salePrice: p.salePrice,
        category: p.category,
        prices
      };
    });

    res.json({ lists, products: result });
  } catch (error) {
    console.error('Error al obtener productos con precios:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /api/pricelists/products/:productId — actualizar precio personalizado de un producto en una lista
router.put('/products/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { listIndex, price, useCustom } = req.body;

    if (!listIndex || listIndex < 1 || listIndex > 6) {
      return res.status(400).json({ message: 'listIndex debe ser entre 1 y 6' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    // Buscar si ya existe una entrada para esta lista
    const existingIdx = product.customPrices.findIndex(cp => cp.listIndex === listIndex);

    if (existingIdx >= 0) {
      product.customPrices[existingIdx].price = price;
      product.customPrices[existingIdx].useCustom = useCustom;
    } else {
      product.customPrices.push({ listIndex, price, useCustom });
    }

    await product.save();
    res.json({ message: 'Precio actualizado', customPrices: product.customPrices });
  } catch (error) {
    console.error('Error al actualizar precio personalizado:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /api/pricelists/:index/apply-markup — aplicar el markup global a todos los productos de esta lista
// (resetea precios personalizados usando el markup de la lista)
router.post('/:index/apply-markup', auth, async (req, res) => {
  try {
    const listIndex = parseInt(req.params.index);
    if (listIndex < 1 || listIndex > 6) {
      return res.status(400).json({ message: 'Índice inválido' });
    }

    // Resetear todos los precios personalizados de esta lista (todos vuelven a markup global)
    await Product.updateMany(
      { 'customPrices.listIndex': listIndex },
      { $pull: { customPrices: { listIndex: listIndex } } }
    );

    res.json({ message: `Markup global aplicado a todos los productos en lista ${listIndex}` });
  } catch (error) {
    console.error('Error al aplicar markup global:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

export default router;
