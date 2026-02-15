const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    budget: {
        type: Number,
        required: true,
        min: 0
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    freelancer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    arbitrator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    contractAddress: {
        type: String,
        lowercase: true
    },
    blockchainProjectId: {
        type: Number
    },
    status: {
        type: String,
        enum: ['Draft', 'Open', 'PendingFunding', 'Funded', 'Active', 'Completed', 'Cancelled', 'Disputed'],
        default: 'Draft'
    },
    category: {
        type: String
    }
}, {
    timestamps: true
});

// Virtual for milestones
ProjectSchema.virtual('milestones', {
    ref: 'Milestone',
    localField: '_id',
    foreignField: 'project'
});

ProjectSchema.set('toJSON', { virtuals: true });
ProjectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Project', ProjectSchema);
