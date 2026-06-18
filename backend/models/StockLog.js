import mongoose from 'mongoose';

const stockLogSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['compra', 'venta', 'ajuste_positivo', 'ajuste_negativo', 'inicial'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  stockAfter: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const StockLog = mongoose.model('StockLog', stockLogSchema);
export default StockLog;
