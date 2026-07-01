import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: false,
    default: 'Producto Sin Nombre',
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: false,
    default: 'General',
    trim: true,
    index: true
  },
  purchasePrice: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  },
  salePrice: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  },
  stock: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  },
  minStock: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  },
  expirationDate: {
    type: Date,
    required: false
  },
  active: {
    type: Boolean,
    default: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    default: null
  },
  iva: {
    type: Number,
    required: false,
    default: 21,
    min: 0
  },
  impuestoInterno: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  },
  impuestoInternoTipo: {
    type: String,
    required: false,
    enum: ['porcentaje', 'fijo'],
    default: 'porcentaje'
  },
  // Precios personalizados por lista (override del markup global)
  // Cada entrada: { listIndex: 1-6, price: Number, useCustom: Boolean }
  customPrices: {
    type: [{
      listIndex: { type: Number, min: 1, max: 6, required: true },
      price: { type: Number, min: 0, default: 0 },
      useCustom: { type: Boolean, default: false } // si es false, usa markup global
    }],
    default: []
  }
}, {
  timestamps: true
});

// Índice para búsqueda rápida de productos por código o nombre
productSchema.index({ code: 'text', name: 'text' });

const Product = mongoose.model('Product', productSchema);
export default Product;
