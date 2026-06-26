import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  serialNumber: {
    type: String,
    required: true,
    unique: true
  },
  mac: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  ip: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  connectionType: {
    type: String,
    enum: ['wifi', 'cable'],
    default: 'cable'
  },
  isAuthorized: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  activeUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  lastActive: {
    type: Date,
    default: null
  },
  userAgent: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Device = mongoose.model('Device', deviceSchema);
export default Device;
