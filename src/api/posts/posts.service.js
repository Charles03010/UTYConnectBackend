// src/api/posts/posts.service.js
const db = require('../../db/models');
const { Post, User, Comment, UserLike, UserSave, Sequelize } = db;
const { Op } = Sequelize;
const fs = require('fs');
const path = require('path');

class PostService {
  async createPost(userId, caption, file) {
    if (!file) {
      const error = new Error('Post image is required.');
      error.statusCode = 400;
      throw error;
    }
    const image_url = `/uploads/post_images/${file.filename}`;
    const post = await Post.create({
      user_id: userId,
      caption,
      image_url,
    });
    return Post.findByPk(post.id, { include: [{ model: User, as: 'author', attributes: ['id', 'username', 'profile_picture_url'] }] });
  }

  async findAllPosts(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const { count, rows } = await Post.findAndCountAll({
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'profile_picture_url'] },
        // To get like and comment counts efficiently, use Sequelize.fn
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true, // Important for counts with includes
    });

    // Manually (or via subquery) add like, comment, save counts for each post
    const postsWithCounts = await Promise.all(rows.map(async (post) => {
        const postJson = post.toJSON();
        postJson.likesCount = await UserLike.count({ where: { post_id: post.id } });
        postJson.commentsCount = await Comment.count({ where: { post_id: post.id } });
        postJson.savesCount = await UserSave.count({ where: { post_id: post.id } });
        // Check if current user (if available) liked/saved this post
        // This requires req.user to be passed or handled differently
        return postJson;
    }));

    return {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalPosts: count,
        posts: postsWithCounts,
    };
  }


  async findPostById(postId, currentUserId = null) {
    const post = await Post.findByPk(postId, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'profile_picture_url'] },
        {
          model: Comment,
          as: 'comments',
          include: [{ model: User, as: 'commenter', attributes: ['id', 'username', 'profile_picture_url'] }],
          order: [['createdAt', 'ASC']], // Show oldest comments first for a thread
          // Add nesting for replies here if needed
        },
      ],
    });

    if (!post) {
      const error = new Error('Post not found.');
      error.statusCode = 404;
      throw error;
    }

    const postJson = post.toJSON();
    postJson.likesCount = await UserLike.count({ where: { post_id: postId } });
    postJson.commentsCount = postJson.comments.length; // Or a direct count from DB
    postJson.savesCount = await UserSave.count({ where: { post_id: postId } });

    if (currentUserId) {
        postJson.isLikedByCurrentUser = !!(await UserLike.findOne({ where: { post_id: postId, user_id: currentUserId } }));
        postJson.isSavedByCurrentUser = !!(await UserSave.findOne({ where: { post_id: postId, user_id: currentUserId } }));
    }


    return postJson;
  }

  async updatePost(postId, userId, caption) {
    const post = await Post.findOne({ where: { id: postId, user_id: userId } });
    if (!post) {
      const error = new Error('Post not found or user not authorized to update.');
      error.statusCode = 404; // Or 403
      throw error;
    }
    post.caption = caption !== undefined ? caption : post.caption;
    await post.save();
    return Post.findByPk(post.id, { include: [{ model: User, as: 'author', attributes: ['id', 'username', 'profile_picture_url'] }] });
  }

  async deletePost(postId, userId) {
    const post = await Post.findOne({ where: { id: postId, user_id: userId } });
    if (!post) {
      const error = new Error('Post not found or user not authorized to delete.');
      error.statusCode = 404; // Or 403
      throw error;
    }

    // Delete associated image file
    if (post.image_url) {
      const imagePath = path.join(__dirname, '..', '..', '..', 'public', post.image_url.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (e) {
            console.error("Failed to delete post image:", e);
        }
      }
    }
    await post.destroy(); // This should cascade delete likes, comments, saves due to model associations
    return { message: 'Post deleted successfully.' };
  }

  async likePost(userId, postId) {
    const post = await Post.findByPk(postId);
    if (!post) {
      const error = new Error('Post not found.');
      error.statusCode = 404;
      throw error;
    }
    const [like, created] = await UserLike.findOrCreate({
      where: { user_id: userId, post_id: postId },
      defaults: { user_id: userId, post_id: postId }
    });
    if (!created) return { message: 'Post already liked.' };
    return { message: 'Post liked successfully.' };
  }

  async unlikePost(userId, postId) {
    const result = await UserLike.destroy({ where: { user_id: userId, post_id: postId } });
    if (result === 0) {
        const error = new Error('Post not liked by user or post not found.');
        error.statusCode = 404; // Or 400
        throw error;
    }
    return { message: 'Post unliked successfully.' };
  }

  async savePost(userId, postId) {
    const post = await Post.findByPk(postId);
    if (!post) {
      const error = new Error('Post not found.');
      error.statusCode = 404;
      throw error;
    }
    const [save, created] = await UserSave.findOrCreate({
      where: { user_id: userId, post_id: postId },
      defaults: { user_id: userId, post_id: postId }
    });
    if (!created) return { message: 'Post already saved.' };
    return { message: 'Post saved successfully.' };
  }

  async unsavePost(userId, postId) {
    const result = await UserSave.destroy({ where: { user_id: userId, post_id: postId } });
    if (result === 0) {
        const error = new Error('Post not saved by user or post not found.');
        error.statusCode = 404;
        throw error;
    }
    return { message: 'Post unsaved successfully.' };
  }

  async getPostsLikedByUser(userId) {
    const user = await User.findByPk(userId, {
        include: [{
            model: Post,
            as: 'likedPosts',
            attributes: ['id', 'image_url', 'caption', 'createdAt'],
            through: { attributes: [] }, // Don't include UserLike attributes
            include: [{ model: User, as: 'author', attributes: ['id', 'username', 'profile_picture_url'] }]
        }],
        order: [[{ model: Post, as: 'likedPosts' }, 'createdAt', 'DESC']]
    });
    if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }
    return user.likedPosts;
  }

  async getPostsSavedByUser(userId) {
     const user = await User.findByPk(userId, {
        include: [{
            model: Post,
            as: 'savedPosts',
            attributes: ['id', 'image_url', 'caption', 'createdAt'],
            through: { attributes: [] },
            include: [{ model: User, as: 'author', attributes: ['id', 'username', 'profile_picture_url'] }]
        }],
        order: [[{ model: Post, as: 'savedPosts' }, 'createdAt', 'DESC']]
    });
    if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }
    return user.savedPosts;
  }

  async getUsersWhoLikedPost(postId) {
    const post = await Post.findByPk(postId, {
        include: [{
            model: User,
            as: 'likedByUsers',
            attributes: ['id', 'username', 'name', 'profile_picture_url'],
            through: { attributes: [] } // Don't include UserLike attributes
        }]
    });
    if (!post) {
        const error = new Error('Post not found.');
        error.statusCode = 404;
        throw error;
    }
    return post.likedByUsers;
  }
}

module.exports = new PostService();