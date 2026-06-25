const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  facility: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
}, { timestamps: true });

reviewSchema.index({ user: 1, facility: 1 }, { unique: true });

// Update facility rating after review save
reviewSchema.post('save', async function () {
  const Facility = mongoose.model('Facility');
  const reviews = await mongoose.model('Review').find({ facility: this.facility });
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await Facility.findByIdAndUpdate(this.facility, {
    rating: Math.round(avg * 10) / 10,
    totalReviews: reviews.length,
  });
});

module.exports = mongoose.model('Review', reviewSchema);
