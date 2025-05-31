// src/api/users/users.service.js
const db = require("../../db/models");
const { User, UserFollow, Post, Sequelize } = db;
const { Op } = Sequelize;
const path = require("path");
const fs = require("fs");

class UserService {
  async findUserPublicProfile(identifier) {
    // Identifier can be ID or username
    const isNumericId = /^\d+$/.test(identifier);
    const whereCondition = isNumericId
      ? { id: parseInt(identifier) }
      : { username: identifier };

    const user = await User.findOne({
      where: whereCondition,
      attributes: [
        "id",
        "name",
        "username",
        "bio",
        "profile_picture_url",
        "createdAt",
      ],
      include: [
        {
          model: User,
          as: "followers",
          attributes: ["id", "username", "profile_picture_url"],
          through: { attributes: [] }, // Don't include UserFollow attributes
        },
        {
          model: User,
          as: "following",
          attributes: ["id", "username", "profile_picture_url"],
          through: { attributes: [] },
        },
        {
          model: Post,
          as: "posts",
          attributes: ["id", "image_url", "caption", "createdAt"],
          // Add counts later if needed or separate endpoints
        },
      ],
      // Add order for posts, followers, following if needed
      order: [[{ model: Post, as: "posts" }, "createdAt", "DESC"]],
    });

    if (!user) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }
    // Manually count followers and following for simplicity, or use Sequelize.fn
    const userJson = user.toJSON();
    userJson.followersCount = userJson.followers.length;
    userJson.followingCount = userJson.following.length;
    userJson.postsCount = userJson.posts.length;

    return userJson;
  }

  async updateUserProfile(userId, updateData, file) {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }

    const { name, bio, username, email } = updateData;

    if (username && username !== user.username) {
      const existingUser = await User.findOne({
        where: { username, id: { [Op.ne]: userId } },
      });
      if (existingUser) {
        const error = new Error("Username already taken.");
        error.statusCode = 409;
        throw error;
      }
      user.username = username;
    }
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        where: { email, id: { [Op.ne]: userId } },
      });
      if (existingUser) {
        const error = new Error("Email already registered by another user.");
        error.statusCode = 409;
        throw error;
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (bio) user.bio = bio;

    if (file) {
      // If there's an old profile picture, delete it (optional)
      if (user.profile_picture_url) {
        const oldImagePath = path.join(
          __dirname,
          "..",
          "..",
          "..",
          "public",
          user.profile_picture_url.replace("/uploads/", "uploads/")
        );
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
          } catch (e) {
            console.error("Failed to delete old profile picture:", e);
          }
        }
      }
      user.profile_picture_url = `/uploads/profile_pictures/${file.filename}`;
    }

    await user.save();
    const userJson = user.toJSON();
    delete userJson.password; // Ensure password is not returned
    return userJson;
  }

  async followUser(followerId, followingUsername) {
    const userToFollow = await User.findOne({
      where: { username: followingUsername },
    });
    if (!userToFollow) {
      const error = new Error("User to follow not found.");
      error.statusCode = 404;
      throw error;
    }

    if (followerId === userToFollow.id) {
      const error = new Error("You cannot follow yourself.");
      error.statusCode = 400;
      throw error;
    }

    const [follow, created] = await UserFollow.findOrCreate({
      where: { follower_id: followerId, following_id: userToFollow.id },
      defaults: { follower_id: followerId, following_id: userToFollow.id },
    });

    if (!created) {
      return { message: "You are already following this user." };
    }
    return { message: `Successfully followed ${userToFollow.username}.` };
  }

  async unfollowUser(followerId, followingUsername) {
    const userToUnfollow = await User.findOne({
      where: { username: followingUsername },
    });
    if (!userToUnfollow) {
      const error = new Error("User to unfollow not found.");
      error.statusCode = 404;
      throw error;
    }

    const result = await UserFollow.destroy({
      where: { follower_id: followerId, following_id: userToUnfollow.id },
    });

    if (result === 0) {
      return { message: "You are not following this user." };
    }
    return { message: `Successfully unfollowed ${userToUnfollow.username}.` };
  }

  async getFollowers(username) {
    const user = await User.findOne({
      where: { username },
      include: [
        {
          model: User,
          as: "followers",
          attributes: ["id", "username", "name", "profile_picture_url"],
          through: { attributes: [] },
        },
      ],
    });
    if (!user) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }
    return user.followers;
  }

  async getFollowing(username) {
    const user = await User.findOne({
      where: { username },
      include: [
        {
          model: User,
          as: "following",
          attributes: ["id", "username", "name", "profile_picture_url"],
          through: { attributes: [] },
        },
      ],
    });
    if (!user) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }
    return user.following;
  }
}

module.exports = new UserService();
