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
  }
}, {
  timestamps: true
});

// Índice para búsqueda rápida de productos por código o nombre
productSchema.index({ code: 'text', name: 'text' });

const Product = mongoose.model('Product', productSchema);
export default Product;
