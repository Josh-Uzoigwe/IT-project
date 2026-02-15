const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const Message = require('../models/Message');
const Project = require('../models/Project');

/**
 * @route   POST /api/messages
 * @desc    Send a message
 * @access  Private
 */
router.post('/', authMiddleware, [
    body('projectId').notEmpty().withMessage('Project ID required'),
    body('recipientId').notEmpty().withMessage('Recipient ID required'),
    body('text').trim().notEmpty().withMessage('Message text required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { projectId, recipientId, text } = req.body;

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Verify user is involved in project
        const isInvolved =
            project.client.toString() === req.userId ||
            (project.freelancer && project.freelancer.toString() === req.userId);

        if (!isInvolved) {
            return res.status(403).json({ error: 'Not authorized to message on this project' });
        }

        const message = new Message({
            project: projectId,
            sender: req.userId,
            recipient: recipientId,
            text
        });

        await message.save();

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name email')
            .populate('recipient', 'name email');

        res.status(201).json({
            message: 'Message sent successfully',
            data: populatedMessage
        });
    } catch (error) {
        console.error('Message send error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/messages/project/:projectId
 * @desc    Get message thread for a project
 * @access  Private
 */
router.get('/project/:projectId', authMiddleware, async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Verify user is involved
        const isInvolved =
            project.client.toString() === req.userId ||
            (project.freelancer && project.freelancer.toString() === req.userId);

        if (!isInvolved) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const messages = await Message.find({ project: req.params.projectId })
            .populate('sender', 'name email')
            .populate('recipient', 'name email')
            .sort({ createdAt: 1 });

        res.json({ messages });
    } catch (error) {
        console.error('Messages fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   PUT /api/messages/:id/read
 * @desc    Mark message as read
 * @access  Private
 */
router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (message.recipient.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        message.isRead = true;
        await message.save();

        res.json({ message: 'Message marked as read' });
    } catch (error) {
        console.error('Message update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
