// src/api/users/users.controller.js
const userService = require('./users.service');
const { validationResult } = require('express-validator');

class UserController {
  async getUserProfile(req, res, next) {
    try {
      const { identifier } = req.params; // Can be username or ID
      const user = await userService.findUserPublicProfile(identifier);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateUserProfile(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Validation failed.');
      err.statusCode = 400;
      err.errors = errors.array();
      return next(err);
    }
    try {
      const updatedUser = await userService.updateUserProfile(req.user.id, req.body, req.file);
      res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
      next(error);
    }
  }

  async followUser(req, res, next) {
    try {
      const { username: followingUsername } = req.params;
      const result = await userService.followUser(req.user.id, followingUsername);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async unfollowUser(req, res, next) {
    try {
      const { username: followingUsername } = req.params;
      const result = await userService.unfollowUser(req.user.id, followingUsername);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getFollowers(req, res, next) {
    try {
        const { username } = req.params;
        const followers = await userService.getFollowers(username);
        res.status(200).json(followers);
    } catch (error) {
        next(error);
    }
  }

  async getFollowing(req, res, next) {
    try {
        const { username } = req.params;
        const following = await userService.getFollowing(username);
        res.status(200).json(following);
    } catch (error) {
        next(error);
    }
  }
}

module.exports = new UserController();