const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    blockchainMilestoneId: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Submitted', 'Approved', 'Disputed', 'Paid', 'Refunded'],
        default: 'Pending'
    },
    submissionFiles: [{
        url: String,
        name: String,
        uploadedAt: Date
    }],
    submissionNotes: {
        type: String
    },
    submittedAt: {
        type: Date
    },
    approvedAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Milestone', MilestoneSchema);
