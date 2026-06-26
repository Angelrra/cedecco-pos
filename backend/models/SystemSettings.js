import mongoose from 'mongoose';

const SystemSettingsSchema = new mongoose.Schema({
  ticketName: {
    type: String,
    default: 'CEDECCO INSUMOS INFORMÁTICOS'
  },
  ticketAddress: {
    type: String,
    default: 'Av. del Puerto 1234, CABA'
  },
  ticketPhone: {
    type: String,
    default: 'Tel: 4567-8910'
  },
  mercadopagoAccessToken: {
    type: String,
    default: ''
  },
  aiProtectionsEnabled: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model('SystemSettings', SystemSettingsSchema);
