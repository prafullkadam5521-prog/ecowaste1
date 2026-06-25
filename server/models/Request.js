const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  facility: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
  wasteItems: [{
    type: { type: String, enum: ['mobile', 'laptop', 'battery', 'television', 'refrigerator', 'printer', 'other'] },
    quantity: { type: Number, default: 1 },
    description: String,
  }],
  serviceType: { type: String, enum: ['pickup', 'dropoff'], required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'collected', 'recycled', 'completed'],
    default: 'pending',
  },
  scheduledDate: { type: Date },
  scheduledTime: { type: String },
  pickupAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
  },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  statusHistory: [{
    status: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String,
    updatedAt: { type: Date, default: Date.now },
  }],
  isReviewed: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
