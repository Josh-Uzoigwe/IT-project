const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    ratedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ratedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    review: {
        type: String
    }
}, {
    timestamps: true
});

// Prevent duplicate ratings
RatingSchema.index({ project: 1, ratedBy: 1 }, { unique: true });

module.exports = mongoose.model('Rating', RatingSchema);
