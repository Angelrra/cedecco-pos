import mongoose from 'mongoose';

// Configuración de cada lista de precios (6 listas globales)
const priceListSchema = new mongoose.Schema({
  index: {
    type: Number,
    required: true,
    min: 1,
    max: 6,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    default: function() { return `Lista ${this.index}`; }
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  // Markup global por defecto para esta lista (porcentaje sobre costo)
  // Ej: 30 = 30% de ganancia sobre el precio de costo
  markup: {
    type: Number,
    required: true,
    default: 0,
    min: -100
  },
  color: {
    type: String,
    default: '#6366f1'
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const PriceList = mongoose.model('PriceList', priceListSchema);
export default PriceList;
