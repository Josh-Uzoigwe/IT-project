const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authMiddleware, requireRole } = require('../middleware/auth');
const Proposal = require('../models/Proposal');
const Project = require('../models/Project');
const User = require('../models/User');

/**
 * @route   POST /api/proposals
 * @desc    Submit a proposal for a project
 * @access  Private (Freelancer only)
 */
router.post('/', [authMiddleware, requireRole('Freelancer')], [
    body('projectId').notEmpty().withMessage('Project ID required'),
    body('coverLetter').trim().notEmpty().withMessage('Cover letter required'),
    body('proposedTimeline').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { projectId, coverLetter, proposedTimeline } = req.body;

        // Check project exists and is open
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (project.status !== 'Open') {
            return res.status(400).json({ error: 'Project is not accepting proposals' });
        }

        // Check if already submitted proposal
        const existingProposal = await Proposal.findOne({
            project: projectId,
            freelancer: req.userId
        });

        if (existingProposal) {
            return res.status(400).json({ error: 'You have already submitted a proposal for this project' });
        }

        // Create proposal
        const proposal = new Proposal({
            project: projectId,
            freelancer: req.userId,
            coverLetter,
            proposedTimeline
        });

        await proposal.save();

        const populatedProposal = await Proposal.findById(proposal._id)
            .populate('freelancer', 'name email rating profile');

        res.status(201).json({
            message: 'Proposal submitted successfully',
            proposal: populatedProposal
        });
    } catch (error) {
        console.error('Proposal submission error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/proposals/project/:projectId
 * @desc    Get all proposals for a project
 * @access  Private (Client only for their projects)
 */
router.get('/project/:projectId', authMiddleware, async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Only client can view proposals
        if (project.client.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized to view these proposals' });
        }

        const proposals = await Proposal.find({ project: req.params.projectId })
            .populate('freelancer', 'name email rating profile')
            .sort({ createdAt: -1 });

        res.json({ proposals });
    } catch (error) {
        console.error('Proposals fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   PUT /api/proposals/:id/accept
 * @desc    Accept a proposal
 * @access  Private (Client only)
 */
router.put('/:id/accept', [authMiddleware, requireRole('Client')], async (req, res) => {
    try {
        const proposal = await Proposal.findById(req.params.id).populate('project');

        if (!proposal) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        const project = await Project.findById(proposal.project._id);

        // Verify client owns the project
        if (project.client.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (project.status !== 'Open') {
            return res.status(400).json({ error: 'Project is not open for proposals' });
        }

        // Accept this proposal
        proposal.status = 'Accepted';
        await proposal.save();

        // Reject all other proposals
        await Proposal.updateMany(
            { project: project._id, _id: { $ne: proposal._id } },
            { status: 'Rejected' }
        );

        // Update project
        project.freelancer = proposal.freelancer;
        project.status = 'PendingFunding';
        await project.save();

        res.json({
            message: 'Proposal accepted successfully',
            proposal,
            project
        });
    } catch (error) {
        console.error('Proposal acceptance error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
