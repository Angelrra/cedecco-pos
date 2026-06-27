import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  cuit: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  // Lista de precios por defecto para este cliente (1-6, null = usar lista 1)
  defaultPriceListIndex: {
    type: Number,
    min: 1,
    max: 6,
    default: 1
  },
  notes: {
    type: String,
    default: ''
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

customerSchema.index({ name: 'text', email: 'text', cuit: 'text' });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
