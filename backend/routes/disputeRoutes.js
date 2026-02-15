const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authMiddleware, requireRole } = require('../middleware/auth');
const Dispute = require('../models/Dispute');
const Milestone = require('../models/Milestone');
const Project = require('../models/Project');

/**
 * @route   POST /api/disputes
 * @desc    Raise a dispute on a milestone
 * @access  Private (Client or Freelancer)
 */
router.post('/', authMiddleware, [
    body('milestoneId').notEmpty().withMessage('Milestone ID required'),
    body('reason').trim().notEmpty().withMessage('Reason required'),
    body('evidenceFiles').optional().isArray()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { milestoneId, reason, evidenceFiles } = req.body;

        const milestone = await Milestone.findById(milestoneId).populate('project');

        if (!milestone) {
            return res.status(404).json({ error: 'Milestone not found' });
        }

        const project = milestone.project;

        // Verify user is client or freelancer
        const isClient = project.client.toString() === req.userId;
        const isFreelancer = project.freelancer && project.freelancer.toString() === req.userId;

        if (!isClient && !isFreelancer) {
            return res.status(403).json({ error: 'Not authorized to raise dispute' });
        }

        if (milestone.status !== 'Submitted') {
            return res.status(400).json({ error: 'Can only dispute submitted milestones' });
        }

        // Update milestone status
        milestone.status = 'Disputed';
        await milestone.save();

        // Update project status
        project.status = 'Disputed';
        await project.save();

        // Create dispute
        const dispute = new Dispute({
            project: project._id,
            milestone: milestoneId,
            raisedBy: req.userId,
            reason,
            evidenceFiles: evidenceFiles || [],
            arbitrator: project.arbitrator
        });

        await dispute.save();

        const populatedDispute = await Dispute.findById(dispute._id)
            .populate('raisedBy', 'name email')
            .populate('project', 'title')
            .populate('milestone', 'title amount');

        res.status(201).json({
            message: 'Dispute raised successfully',
            dispute: populatedDispute
        });
    } catch (error) {
        console.error('Dispute creation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/disputes/:id
 * @desc    Get dispute details
 * @access  Private (parties involved only)
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const dispute = await Dispute.findById(req.params.id)
            .populate('project')
            .populate('milestone')
            .populate('raisedBy', 'name email')
            .populate('arbitrator', 'name email');

        if (!dispute) {
            return res.status(404).json({ error: 'Dispute not found' });
        }

        const project = dispute.project;

        // Verify user is involved
        const isInvolved =
            project.client.toString() === req.userId ||
            project.freelancer.toString() === req.userId ||
            project.arbitrator.toString() === req.userId;

        if (!isInvolved) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        res.json({ dispute });
    } catch (error) {
        console.error('Dispute fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   POST /api/disputes/:id/resolve
 * @desc    Arbitrator resolves a dispute
 * @access  Private (Arbitrator only)
 */
router.post('/:id/resolve', [authMiddleware, requireRole('Arbitrator')], [
    body('freelancerPercentage').isInt({ min: 0, max: 100 }).withMessage('Percentage must be 0-100'),
    body('notes').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const dispute = await Dispute.findById(req.params.id).populate('project');

        if (!dispute) {
            return res.status(404).json({ error: 'Dispute not found' });
        }

        const project = dispute.project;

        // Verify this is the assigned arbitrator
        if (project.arbitrator.toString() !== req.userId) {
            return res.status(403).json({ error: 'You are not the assigned arbitrator' });
        }

        if (dispute.status === 'Resolved') {
            return res.status(400).json({ error: 'Dispute already resolved' });
        }

        const { freelancerPercentage, notes } = req.body;

        // Update dispute
        dispute.decision = {
            freelancerPercentage,
            notes,
            decidedAt: new Date()
        };
        dispute.status = 'Resolved';

        await dispute.save();

        res.json({
            message: 'Dispute resolved. Please complete the transaction on the blockchain.',
            dispute,
            blockchainTrigger: {
                disputeId: dispute.blockchainDisputeId,
                projectId: project.blockchainProjectId,
                milestoneId: dispute.milestone.blockchainMilestoneId,
                freelancerPercentage
            }
        });
    } catch (error) {
        console.error('Dispute resolution error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/disputes/project/:projectId
 * @desc    Get all disputes for a project
 * @access  Private
 */
router.get('/project/:projectId', authMiddleware, async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const disputes = await Dispute.find({ project: req.params.projectId })
            .populate('milestone', 'title amount')
            .populate('raisedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({ disputes });
    } catch (error) {
        console.error('Disputes fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
