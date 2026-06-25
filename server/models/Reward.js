const mongoose = require('mongoose');

// Points awarded per waste item type
const POINTS_MAP = {
  mobile:       50,
  laptop:       80,
  battery:      30,
  television:   70,
  refrigerator: 100,
  printer:      60,
  other:        20,
};

const rewardSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
  points:  { type: Number, required: true },
  breakdown: [{ // points per each waste item
    wasteType: String,
    quantity:  Number,
    points:    Number,
  }],
  description: { type: String }, // e.g. "Recycled 2 mobiles & 1 battery"
}, { timestamps: true });

rewardSchema.statics.POINTS_MAP = POINTS_MAP;

module.exports = mongoose.model('Reward', rewardSchema);
