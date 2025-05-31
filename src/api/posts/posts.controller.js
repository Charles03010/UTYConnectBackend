// src/api/posts/posts.controller.js
const postService = require('./posts.service');
const { validationResult } = require('express-validator');

class PostController {
  async createPost(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Validation failed.');
      err.statusCode = 400;
      err.errors = errors.array();
      return next(err);
    }
    try {
      const { caption } = req.body;
      const post = await postService.createPost(req.user.id, caption, req.file);
      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  }

  async getAllPosts(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const postsData = await postService.findAllPosts(page, limit);
      res.status(200).json(postsData);
    } catch (error) {
      next(error);
    }
  }

  async getPostById(req, res, next) {
    try {
      const postId = parseInt(req.params.postId);
      const currentUserId = req.user ? req.user.id : null; // If route is optionally authenticated
      const post = await postService.findPostById(postId, currentUserId);
      res.status(200).json(post);
    } catch (error) {
      next(error);
    }
  }

  async updatePost(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Validation failed.');
      err.statusCode = 400;
      err.errors = errors.array();
      return next(err);
    }
    try {
      const postId = parseInt(req.params.postId);
      const { caption } = req.body;
      const updatedPost = await postService.updatePost(postId, req.user.id, caption);
      res.status(200).json({ message: 'Post updated successfully', post: updatedPost });
    } catch (error) {
      next(error);
    }
  }

  async deletePost(req, res, next) {
    try {
      const postId = parseInt(req.params.postId);
      const result = await postService.deletePost(postId, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async likePost(req, res, next) {
    try {
      const postId = parseInt(req.params.postId);
      const result = await postService.likePost(req.user.id, postId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async unlikePost(req, res, next) {
    try {
      const postId = parseInt(req.params.postId);
      const result = await postService.unlikePost(req.user.id, postId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async savePost(req, res, next) {
    try {
      const postId = parseInt(req.params.postId);
      const result = await postService.savePost(req.user.id, postId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async unsavePost(req, res, next) {
    try {
      const postId = parseInt(req.params.postId);
      const result = await postService.unsavePost(req.user.id, postId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getLikedPosts(req, res, next) {
    try {
      const posts = await postService.getPostsLikedByUser(req.user.id);
      res.status(200).json(posts);
    } catch (error) {
      next(error);
    }
  }

  async getSavedPosts(req, res, next) {
    try {
      const posts = await postService.getPostsSavedByUser(req.user.id);
      res.status(200).json(posts);
    } catch (error) {
      next(error);
    }
  }

  async getUsersWhoLikedPost(req, res, next) {
    try {
        const postId = parseInt(req.params.postId);
        const users = await postService.getUsersWhoLikedPost(postId);
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
  }
}

module.exports = new PostController();