import express from 'express';
import Customer from '../models/Customer.js';
import Sale from '../models/Sale.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/customers — listar clientes con búsqueda
router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = { active: true };
    if (search) {
      const escaped = search.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
        { phone: { $regex: escaped, $options: 'i' } },
        { cuit: { $regex: escaped, $options: 'i' } }
      ];
    }
    const customers = await Customer.find(query).sort({ name: 1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener clientes', error: err.message });
  }
});

// GET /api/customers/:id — obtener cliente por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer || !customer.active) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
});

// GET /api/customers/:id/sales — historial de compras del cliente
router.get('/:id/sales', auth, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const sales = await Sale.find({ customer: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener historial', error: err.message });
  }
});

// POST /api/customers — crear cliente
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, phone, cuit, address, defaultPriceListIndex, notes } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'El nombre es requerido' });
    const customer = new Customer({ name: name.trim(), email, phone, cuit, address, defaultPriceListIndex, notes });
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear cliente', error: err.message });
  }
});

// PUT /api/customers/:id — actualizar cliente
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, email, phone, cuit, address, defaultPriceListIndex, notes } = req.body;
    const customer = await Customer.findById(req.params.id);
    if (!customer || !customer.active) return res.status(404).json({ message: 'Cliente no encontrado' });
    if (name !== undefined) customer.name = name.trim();
    if (email !== undefined) customer.email = email;
    if (phone !== undefined) customer.phone = phone;
    if (cuit !== undefined) customer.cuit = cuit;
    if (address !== undefined) customer.address = address;
    if (defaultPriceListIndex !== undefined) customer.defaultPriceListIndex = defaultPriceListIndex;
    if (notes !== undefined) customer.notes = notes;
    await customer.save();
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar cliente', error: err.message });
  }
});

// DELETE /api/customers/:id — baja lógica
router.delete('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer || !customer.active) return res.status(404).json({ message: 'Cliente no encontrado' });
    customer.active = false;
    await customer.save();
    res.json({ message: 'Cliente eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar cliente', error: err.message });
  }
});

export default router;
