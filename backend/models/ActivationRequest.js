import mongoose from 'mongoose';

const activationRequestSchema = new mongoose.Schema({
  requestCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  deviceName: {
    type: String,
    default: 'Dispositivo Remoto'
  },
  ip: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const ActivationRequest = mongoose.model('ActivationRequest', activationRequestSchema);
export default ActivationRequest;
