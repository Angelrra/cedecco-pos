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
  unitCost: { type: Number, required: true, min: 0 },
  iva: { type: Number, default: 21 },
  impuestoInterno: { type: Number, default: 0 },
  impuestoInternoTipo: { type: String, enum: ['porcentaje', 'fijo'], default: 'porcentaje' }
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
  exchangeRate: {
    type: Number,
    default: null
  },
  // Totales calculados
  subtotal: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
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
  let sub = 0;
  let tot = 0;
  
  this.items.forEach(item => {
    const itemSubtotal = item.unitCost * item.quantityOrdered;
    sub += itemSubtotal;
    
    // Calculo de impuestos
    const ivaAmount = itemSubtotal * ((item.iva || 0) / 100);
    let impIntAmount = 0;
    
    if (item.impuestoInternoTipo === 'fijo') {
      impIntAmount = (item.impuestoInterno || 0) * item.quantityOrdered;
    } else {
      impIntAmount = itemSubtotal * ((item.impuestoInterno || 0) / 100);
    }
    
    tot += itemSubtotal + ivaAmount + impIntAmount;
  });
  
  this.subtotal = sub;
  this.total = tot;
  next();
});

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
export default PurchaseOrder;
