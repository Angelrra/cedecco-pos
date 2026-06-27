import mongoose from 'mongoose';

const poItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  code: { type: String, required: true },
  quantityOrdered: { type: Number, required: true, min: 1 },
  quantityReceived: { type: Number, default: 0, min: 0 },
  unitCost: { type: Number, required: true, min: 0 }
});

const purchaseOrderSchema = new mongoose.Schema({
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  status: {
    type: String,
    enum: ['borrador', 'enviada', 'recibida', 'cancelada'],
    default: 'borrador'
  },
  items: [poItemSchema],
  notes: {
    type: String,
    default: ''
  },
  expectedDate: {
    type: Date,
    default: null
  },
  receivedDate: {
    type: Date,
    default: null
  },
  // Totales calculados
  subtotal: { type: Number, default: 0 },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Calcular subtotal antes de guardar
purchaseOrderSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.unitCost * item.quantityOrdered);
  }, 0);
  next();
});

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
export default PurchaseOrder;
