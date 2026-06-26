import mongoose from 'mongoose';

const SupplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  cuit: {
    type: String,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  apiConfig: {
    enabled: {
      type: Boolean,
      default: false
    },
    url: {
      type: String,
      default: ''
    },
    method: {
      type: String,
      enum: ['GET', 'POST'],
      default: 'GET'
    },
    authHeader: {
      type: String,
      default: ''
    },
    authToken: {
      type: String,
      default: ''
    },
    apiType: {
      type: String,
      enum: ['rest_json', 'none'],
      default: 'none'
    },
    mapping: {
      code: { type: String, default: 'code' },
      name: { type: String, default: 'name' },
      purchasePrice: { type: String, default: 'price' },
      stock: { type: String, default: 'stock' }
    },
    lastSync: {
      type: Date,
      default: null
    },
    syncLog: {
      type: String,
      default: ''
    }
  }
}, {
  timestamps: true
});

const Supplier = mongoose.model('Supplier', SupplierSchema);
export default Supplier;
