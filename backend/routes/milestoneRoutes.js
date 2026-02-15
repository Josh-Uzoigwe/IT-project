const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authMiddleware, requireRole } = require('../middleware/auth');
const Milestone = require('../models/Milestone');
const Project = require('../models/Project');

/**
 * @route   POST /api/milestones/:id/submit
 * @desc    Submit work for a milestone
 * @access  Private (Freelancer only)
 */
router.post('/:id/submit', [authMiddleware, requireRole('Freelancer')], [
    body('submissionNotes').optional().trim(),
    body('files').optional().isArray()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const milestone = await Milestone.findById(req.params.id).populate('project');

        if (!milestone) {
            return res.status(404).json({ error: 'Milestone not found' });
        }

        const project = milestone.project;

        // Verify freelancer owns the project
        if (project.freelancer.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (milestone.status !== 'Pending') {
            return res.status(400).json({ error: 'Milestone already submitted or processed' });
        }

        const { submissionNotes, files } = req.body;

        // Update milestone
        milestone.status = 'Submitted';
        milestone.submissionNotes = submissionNotes;
        milestone.submissionFiles = files || [];
        milestone.submittedAt = new Date();

        await milestone.save();

        res.json({
            message: 'Milestone submitted successfully',
            milestone
        });
    } catch (error) {
        console.error('Milestone submission error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   POST /api/milestones/:id/approve
 * @desc    Approve a milestone (triggers blockchain payment)
 * @access  Private (Client only)
 */
router.post('/:id/approve', [authMiddleware, requireRole('Client')], async (req, res) => {
    try {
        const milestone = await Milestone.findById(req.params.id).populate('project');

        if (!milestone) {
            return res.status(404).json({ error: 'Milestone not found' });
        }

        const project = milestone.project;

        // Verify client owns the project
        if (project.client.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (milestone.status !== 'Submitted') {
            return res.status(400).json({ error: 'Milestone must be submitted before approval' });
        }

        // Update milestone (blockchain transaction will be handled by frontend)
        milestone.status = 'Approved';
        milestone.approvedAt = new Date();

        await milestone.save();

        res.json({
            message: 'Milestone approved. Please complete the transaction on the blockchain.',
            milestone,
            blockchainTrigger: {
                projectId: project.blockchainProjectId,
                milestoneId: milestone.blockchainMilestoneId
            }
        });
    } catch (error) {
        console.error('Milestone approval error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/milestones/project/:projectId
 * @desc    Get all milestones for a project
 * @access  Private
 */
router.get('/project/:projectId', authMiddleware, async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const milestones = await Milestone.find({ project: req.params.projectId })
            .sort({ blockchainMilestoneId: 1 });

        res.json({ milestones });
    } catch (error) {
        console.error('Milestones fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   POST /api/milestones/:id/paid
 * @desc    Mark milestone as paid (called by webhook/event listener after blockchain confirmation)
 * @access  Internal
 */
router.post('/:id/paid', async (req, res) => {
    try {
        // In production, verify this request is coming from your event listener
        const { transactionHash } = req.body;

        const milestone = await Milestone.findById(req.params.id).populate('project');

        if (!milestone) {
            return res.status(404).json({ error: 'Milestone not found' });
        }

        milestone.status = 'Paid';
        await milestone.save();

        // Check if all milestones are paid
        const allMilestones = await Milestone.find({ project: milestone.project._id });
        const allPaid = allMilestones.every(m => m.status === 'Paid');

        if (allPaid) {
            const project = await Project.findById(milestone.project._id);
            project.status = 'Completed';
            await project.save();
        }

        res.json({ message: 'Milestone marked as paid', milestone });
    } catch (error) {
        console.error('Milestone paid update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
