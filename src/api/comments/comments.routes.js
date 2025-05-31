// src/api/comments/comments.routes.js
const express = require('express');
const commentController = require('./comments.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');
const { body, param, query } = require('express-validator');

// This router is typically mounted with a postId in the path, e.g., /posts/:postId/comments
// So, req.postId should be available from the parent router.
const router = express.Router({ mergeParams: true }); // mergeParams allows access to parent router's params like :postId

// Create a new comment for a post (POST /posts/:postId/comments)
router.post(
  '/',
  authenticateToken,
  [
    body('text').notEmpty().withMessage('Comment text cannot be empty').trim().isLength({ max: 1000 }),
    body('parent_comment_id').optional().isInt().withMessage('Parent comment ID must be an integer'),
  ],
  commentController.createComment
);

// Get all comments for a post (GET /posts/:postId/comments)
router.get(
  '/',
   [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  commentController.getCommentsForPost
);

// Get a specific comment by its own ID (GET /posts/:postId/comments/:commentId or just /comments/:commentId)
// If mounted at /comments, then /:commentId
// If nested, /posts/:postId/comments/:commentId
router.get(
  '/:commentId', // This path is relative to where this router is mounted
  [
    param('commentId').isInt().withMessage('Comment ID must be an integer'),
    // param('postId') is implicitly available if mergeParams is true and this is nested
  ],
  commentController.getCommentById
);


// Update a comment (PATCH /posts/:postId/comments/:commentId)
router.patch(
  '/:commentId',
  authenticateToken,
  [
    param('commentId').isInt().withMessage('Comment ID must be an integer'),
    body('text').notEmpty().withMessage('Comment text cannot be empty').trim().isLength({ max: 1000 }),
  ],
  commentController.updateComment
);

// Delete a comment (DELETE /posts/:postId/comments/:commentId)
router.delete(
  '/:commentId',
  authenticateToken,
  [
    param('commentId').isInt().withMessage('Comment ID must be an integer'),
  ],
  commentController.deleteComment
);

module.exports = router;