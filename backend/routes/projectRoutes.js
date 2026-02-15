const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authMiddleware, requireRole } = require('../middleware/auth');
const Project = require('../models/Project');
const Milestone = require('../models/Milestone');
const User = require('../models/User');

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private (Client only)
 */
router.post('/', [authMiddleware, requireRole('Client')], [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('budget').isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
    body('milestones').isArray({ min: 1 }).withMessage('At least one milestone required'),
    body('milestones.*.title').trim().notEmpty().withMessage('Milestone title required'),
    body('milestones.*.amount').isFloat({ min: 0 }).withMessage('Milestone amount must be positive')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, budget, milestones, category, arbitratorId } = req.body;

        // Validate milestones sum to budget
        const milestoneSum = milestones.reduce((sum, m) => sum + parseFloat(m.amount), 0);
        if (Math.abs(milestoneSum - parseFloat(budget)) > 0.01) {
            return res.status(400).json({ error: 'Milestones must sum to total budget' });
        }

        // Verify arbitrator exists if provided
        if (arbitratorId) {
            const arbitrator = await User.findOne({ _id: arbitratorId, role: 'Arbitrator' });
            if (!arbitrator) {
                return res.status(400).json({ error: 'Invalid arbitrator' });
            }
        }

        // Create project
        const project = new Project({
            title,
            description,
            budget,
            client: req.userId,
            arbitrator: arbitratorId,
            category,
            status: 'Open'
        });

        await project.save();

        // Create milestones
        for (let i = 0; i < milestones.length; i++) {
            const milestone = new Milestone({
                project: project._id,
                blockchainMilestoneId: i,
                title: milestones[i].title,
                amount: milestones[i].amount,
                status: 'Pending'
            });
            await milestone.save();
        }

        // Populate and return
        const populatedProject = await Project.findById(project._id)
            .populate('client', 'name email')
            .populate('arbitrator', 'name email')
            .populate('milestones');

        res.status(201).json({
            message: 'Project created successfully',
            project: populatedProject
        });
    } catch (error) {
        console.error('Project creation error:', error);
        res.status(500).json({ error: 'Server error during project creation' });
    }
});

/**
 * @route   GET /api/projects
 * @desc    Get all projects (filtered by role and status)
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { status, role } = req.query;
        let query = {};

        // Filter based on user role
        if (role === 'my-projects') {
            if (req.userRole === 'Client') {
                query.client = req.userId;
            } else if (req.userRole === 'Freelancer') {
                query.freelancer = req.userId;
            } else if (req.userRole === 'Arbitrator') {
                query.arbitrator = req.userId;
            }
        } else if (role === 'available') {
            // Open projects for freelancers
            query.status = 'Open';
            query.freelancer = null;
        }

        if (status) {
            query.status = status;
        }

        const projects = await Project.find(query)
            .populate('client', 'name email rating')
            .populate('freelancer', 'name email rating')
            .populate('arbitrator', 'name email')
            .sort({ createdAt: -1 });

        res.json({ projects });
    } catch (error) {
        console.error('Projects fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/projects/:id
 * @desc    Get project details
 * @access  Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('client', 'name email walletAddress rating')
            .populate('freelancer', 'name email walletAddress rating')
            .populate('arbitrator', 'name email walletAddress')
            .populate('milestones');

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({ project });
    } catch (error) {
        console.error('Project fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project (before funding)
 * @access  Private (Client only)
 */
router.put('/:id', [authMiddleware, requireRole('Client')], async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (project.client.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (project.status !== 'Draft' && project.status !== 'Open') {
            return res.status(400).json({ error: 'Cannot edit project after it has been accepted' });
        }

        const { title, description, category } = req.body;

        if (title) project.title = title;
        if (description) project.description = description;
        if (category) project.category = category;

        await project.save();

        res.json({ message: 'Project updated successfully', project });
    } catch (error) {
        console.error('Project update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project (if not funded)
 * @access  Private (Client only)
 */
router.delete('/:id', [authMiddleware, requireRole('Client')], async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (project.client.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (project.status !== 'Draft' && project.status !== 'Open') {
            return res.status(400).json({ error: 'Cannot delete project after acceptance' });
        }

        // Delete associated milestones
        await Milestone.deleteMany({ project: project._id });

        await project.deleteOne();

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Project deletion error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
