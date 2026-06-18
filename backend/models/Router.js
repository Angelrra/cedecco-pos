import mongoose from 'mongoose';

const routerSchema = new mongoose.Schema({
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
    default: 'Router Red Local'
  },
  isAuthorized: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Router = mongoose.model('Router', routerSchema);
export default Router;
