const mongoose = require('mongoose');

const DisputeSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    milestone: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Milestone',
        required: true
    },
    blockchainDisputeId: {
        type: Number
    },
    raisedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    evidenceFiles: [{
        url: String,
        name: String,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploadedAt: Date
    }],
    arbitrator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    decision: {
        freelancerPercentage: Number,
        notes: String,
        decidedAt: Date
    },
    status: {
        type: String,
        enum: ['Open', 'UnderReview', 'Resolved'],
        default: 'Open'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Dispute', DisputeSchema);
