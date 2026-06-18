import mongoose from 'mongoose';

const cashSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  openedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  closedAt: {
    type: Date
  },
  initialCash: {
    type: Number,
    required: true,
    min: 0
  },
  // Efectivo
  expectedCash: {
    type: Number,
    required: true,
    min: 0
  },
  actualCash: {
    type: Number
  },
  discrepancy: {
    type: Number,
    default: 0
  },
  // Tarjetas
  expectedCard: {
    type: Number,
    default: 0
  },
  actualCard: {
    type: Number
  },
  discrepancyCard: {
    type: Number,
    default: 0
  },
  // Transferencias
  expectedTransfer: {
    type: Number,
    default: 0
  },
  actualTransfer: {
    type: Number
  },
  discrepancyTransfer: {
    type: Number,
    default: 0
  },
  // Mercado Pago
  expectedMercadoPago: {
    type: Number,
    default: 0
  },
  actualMercadoPago: {
    type: Number
  },
  discrepancyMercadoPago: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['abierta', 'cerrada'],
    default: 'abierta',
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const CashSession = mongoose.model('CashSession', cashSessionSchema);
export default CashSession;
