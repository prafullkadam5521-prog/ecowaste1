const mongoose = require('mongoose');

const dustbinSchema = new mongoose.Schema({
  dustbinId: { type: String, required: true, unique: true, trim: true },
  label:     { type: String, default: '' },
  distance:  { type: Number, default: 0 },
  fillLevel: { type: Number, default: 0, min: 0, max: 100 },
  status:    { type: String, enum: ['EMPTY', 'LOW', 'MEDIUM', 'FULL'], default: 'EMPTY' },
  location: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },  // [lng, lat]
  },
  updatedAt: { type: Date, default: Date.now },
});

// Auto-calculate status from fillLevel before every save
dustbinSchema.pre('save', function (next) {
  const lvl = this.fillLevel;
  if      (lvl <= 30)  this.status = 'EMPTY';
  else if (lvl <= 60)  this.status = 'LOW';
  else if (lvl <= 90)  this.status = 'MEDIUM';
  else                 this.status = 'FULL';

  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Dustbin', dustbinSchema);
