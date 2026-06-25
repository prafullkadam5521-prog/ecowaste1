const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  phone:    { type: String },
  role:     { type: String, enum: ['user', 'admin', 'agent'], default: 'user' },
  address: {
    street: String,
    city:   String,
    state:  String,
    pincode: String,
  },
  location: {
    type:        { type: String, enum: ['Point'] },
    coordinates: { type: [Number] },
  },
  isActive:     { type: Boolean, default: true },
  profileImage: { type: String },

  // ── Reward system ──────────────────────────────────────────
  totalPoints: { type: Number, default: 0 },
  rewardTier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    default: 'Bronze',
  },
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });

// Auto-update tier based on totalPoints
userSchema.methods.updateTier = function () {
  if      (this.totalPoints >= 2000) this.rewardTier = 'Platinum';
  else if (this.totalPoints >= 1000) this.rewardTier = 'Gold';
  else if (this.totalPoints >= 400)  this.rewardTier = 'Silver';
  else                               this.rewardTier = 'Bronze';
};

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  if (this.isModified('totalPoints')) {
    this.updateTier();
  }
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
