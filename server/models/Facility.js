const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  contact: { phone: String, email: String, website: String },
  wasteTypes: [{
    type: String,
    enum: ['mobile', 'laptop', 'battery', 'television', 'refrigerator', 'printer', 'other'],
  }],
  certifications: [{ name: String, issuedBy: String, validUntil: Date }],
  isCertified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  images: [String],
  operatingHours: {
    mon: String, tue: String, wed: String,
    thu: String, fri: String, sat: String, sun: String,
  },
  acceptsPickup: { type: Boolean, default: false },
  acceptsDropoff: { type: Boolean, default: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

facilitySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Facility', facilitySchema);
