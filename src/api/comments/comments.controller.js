// src/api/comments/comments.controller.js
const commentService = require('./comments.service');
const { validationResult } = require('express-validator');

class CommentController {
  async createComment(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Validation failed.');
      err.statusCode = 400;
      err.errors = errors.array();
      return next(err);
    }
    try {
      // req.postId is set by the mounting router in posts.routes.js
      const { text, parent_comment_id } = req.body;
      const comment = await commentService.createComment(req.user.id, req.postId, text, parent_comment_id);
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  }

  async getCommentsForPost(req, res, next) {
    try {
      // req.postId is set by the mounting router
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const commentsData = await commentService.getCommentsForPost(req.postId, page, limit);
      res.status(200).json(commentsData);
    } catch (error) {
      next(error);
    }
  }

  async getCommentById(req, res, next) {
    try {
        const commentId = parseInt(req.params.commentId);
        const comment = await commentService.findCommentById(commentId);
        res.status(200).json(comment);
    } catch (error) {
        next(error);
    }
  }

  async updateComment(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Validation failed.');
      err.statusCode = 400;
      err.errors = errors.array();
      return next(err);
    }
    try {
      const commentId = parseInt(req.params.commentId);
      const { text } = req.body;
      // Optional: Check if req.postId matches comment.post_id for extra security
      const updatedComment = await commentService.updateComment(commentId, req.user.id, text);
      res.status(200).json({ message: 'Comment updated successfully', comment: updatedComment });
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req, res, next) {
    try {
      const commentId = parseInt(req.params.commentId);
      // Optional: Check if req.postId matches comment.post_id for extra security
      const result = await commentService.deleteComment(commentId, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CommentController();