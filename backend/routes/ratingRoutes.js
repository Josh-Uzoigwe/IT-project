const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const Rating = require('../models/Rating');
const Project = require('../models/Project');
const User = require('../models/User');

/**
 * @route   POST /api/ratings
 * @desc    Submit a rating after project completion
 * @access  Private
 */
router.post('/', authMiddleware, [
    body('projectId').notEmpty().withMessage('Project ID required'),
    body('ratedUserId').notEmpty().withMessage('Rated user ID required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('review').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { projectId, ratedUserId, rating, review } = req.body;

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (project.status !== 'Completed') {
            return res.status(400).json({ error: 'Can only rate completed projects' });
        }

        // Verify user is involved
        const isClient = project.client.toString() === req.userId;
        const isFreelancer = project.freelancer && project.freelancer.toString() === req.userId;

        if (!isClient && !isFreelancer) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Verify rated user is the other party
        const isRatingCorrectParty =
            (isClient && ratedUserId === project.freelancer.toString()) ||
            (isFreelancer && ratedUserId === project.client.toString());

        if (!isRatingCorrectParty) {
            return res.status(400).json({ error: 'Can only rate the other party in the project' });
        }

        // Check if already rated
        const existingRating = await Rating.findOne({
            project: projectId,
            ratedBy: req.userId
        });

        if (existingRating) {
            return res.status(400).json({ error: 'You have already rated this project' });
        }

        // Create rating
        const newRating = new Rating({
            project: projectId,
            ratedUser: ratedUserId,
            ratedBy: req.userId,
            rating,
            review
        });

        await newRating.save();

        // Update user's average rating
        const userRatings = await Rating.find({ ratedUser: ratedUserId });
        const avgRating = userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length;

        await User.findByIdAndUpdate(ratedUserId, {
            'rating.average': avgRating,
            'rating.count': userRatings.length
        });

        res.status(201).json({
            message: 'Rating submitted successfully',
            rating: newRating
        });
    } catch (error) {
        console.error('Rating submission error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/ratings/user/:userId
 * @desc    Get all ratings for a user
 * @access  Public
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const ratings = await Rating.find({ ratedUser: req.params.userId })
            .populate('ratedBy', 'name')
            .populate('project', 'title')
            .sort({ createdAt: -1 });

        res.json({ ratings });
    } catch (error) {
        console.error('Ratings fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
