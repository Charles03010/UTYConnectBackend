// src/api/posts/posts.routes.js
const express = require('express');
const postController = require('./posts.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');
const { handleUploadPostImage } = require('../../middleware/fileUpload.middleware');
const { body, param, query } = require('express-validator');
const commentRoutes = require('../comments/comments.routes'); // For nested comment routes

const router = express.Router();

// --- Post Routes ---
router.post(
  '/',
  authenticateToken,
  handleUploadPostImage,
  [
    body('caption').optional().isString().trim().isLength({ max: 2000 }).withMessage('Caption cannot exceed 2000 characters'),
  ],
  postController.createPost
);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  postController.getAllPosts // Public feed, or use authenticateToken for user-specific feed
);

router.get(
  '/:postId',
  authenticateToken, // Or make it optional if public can view
  [
    param('postId').isInt().withMessage('Post ID must be an integer'),
  ],
  postController.getPostById
);

router.patch(
  '/:postId',
  authenticateToken,
  [
    param('postId').isInt().withMessage('Post ID must be an integer'),
    body('caption').optional().isString().trim().isLength({ max: 2000 }).withMessage('Caption cannot exceed 2000 characters'),
  ],
  postController.updatePost
);

router.delete(
  '/:postId',
  authenticateToken,
  [
    param('postId').isInt().withMessage('Post ID must be an integer'),
  ],
  postController.deletePost
);

// --- Like Routes ---
router.post(
  '/:postId/like',
  authenticateToken,
  [
    param('postId').isInt().withMessage('Post ID must be an integer'),
  ],
  postController.likePost
);

router.delete(
  '/:postId/like', // Using DELETE for unlike
  authenticateToken,
  [
    param('postId').isInt().withMessage('Post ID must be an integer'),
  ],
  postController.unlikePost
);

router.get(
  '/:postId/likes', // Get users who liked a post
   [
    param('postId').isInt().withMessage('Post ID must be an integer'),
  ],
  postController.getUsersWhoLikedPost
);


// --- Save Routes ---
router.post(
  '/:postId/save',
  authenticateToken,
  [
    param('postId').isInt().withMessage('Post ID must be an integer'),
  ],
  postController.savePost
);

router.delete(
  '/:postId/save', // Using DELETE for unsave
  authenticateToken,
  [
    param('postId').isInt().withMessage('Post ID must be an integer'),
  ],
  postController.unsavePost
);

// --- User Specific Liked/Saved Posts (Could also be under /users/me/liked-posts) ---
router.get('/user/liked', authenticateToken, postController.getLikedPosts);
router.get('/user/saved', authenticateToken, postController.getSavedPosts);


// --- Nested Comment Routes ---
// Mount comment routes with a base path that includes the postId
// This allows routes like /api/v1/posts/:postId/comments/
router.use('/:postId/comments', (req, res, next) => {
    req.postId = parseInt(req.params.postId); // Make postId available to comment routes
    if (isNaN(req.postId)) {
        const err = new Error('Invalid Post ID in path for comments.');
        err.statusCode = 400;
        return next(err);
    }
    next();
}, commentRoutes);


module.exports = router;