// src/api/comments/comments.service.js
const db = require('../../db/models');
const { Comment, User, Post } = db;

class CommentService {
  async createComment(userId, postId, text, parentCommentId = null) {
    const post = await Post.findByPk(postId);
    if (!post) {
      const error = new Error('Post not found.');
      error.statusCode = 404;
      throw error;
    }

    if (parentCommentId) {
        const parent = await Comment.findOne({where: {id: parentCommentId, post_id: postId}});
        if (!parent) {
            const error = new Error('Parent comment not found or does not belong to this post.');
            error.statusCode = 404;
            throw error;
        }
    }

    const comment = await Comment.create({
      user_id: userId,
      post_id: postId,
      text,
      parent_comment_id: parentCommentId,
    });
    return Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'commenter', attributes: ['id', 'username', 'profile_picture_url'] }]
    });
  }

  async getCommentsForPost(postId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const { count, rows } = await Comment.findAndCountAll({
      where: { post_id: postId, parent_comment_id: null }, // Fetch only top-level comments
      include: [
        { model: User, as: 'commenter', attributes: ['id', 'username', 'profile_picture_url'] },
        {
          model: Comment,
          as: 'replies', // Include replies
          include: [{ model: User, as: 'commenter', attributes: ['id', 'username', 'profile_picture_url'] }],
          order: [['createdAt', 'ASC']],
        }
      ],
      order: [['createdAt', 'ASC']], // Or 'DESC' for newest first
      limit,
      offset,
      distinct: true,
    });

     return {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalComments: count, // This is total top-level comments
        comments: rows,
    };
  }

  async updateComment(commentId, userId, text) {
    const comment = await Comment.findOne({ where: { id: commentId, user_id: userId } });
    if (!comment) {
      const error = new Error('Comment not found or user not authorized.');
      error.statusCode = 404; // Or 403
      throw error;
    }
    comment.text = text;
    await comment.save();
    return Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'commenter', attributes: ['id', 'username', 'profile_picture_url'] }]
    });
  }

  async deleteComment(commentId, userId) {
    const comment = await Comment.findOne({ where: { id: commentId, user_id: userId } });
    if (!comment) {
      const error = new Error('Comment not found or user not authorized.');
      error.statusCode = 404; // Or 403
      throw error;
    }
    // Deleting a comment should also delete its replies (handled by onDelete: 'CASCADE' in model association)
    await comment.destroy();
    return { message: 'Comment deleted successfully.' };
  }

   async findCommentById(commentId) {
    const comment = await Comment.findByPk(commentId, {
      include: [
        { model: User, as: 'commenter', attributes: ['id', 'username', 'profile_picture_url'] },
        { model: Post, as: 'post', attributes: ['id'] },
        {
            model: Comment,
            as: 'parentComment',
            include: [{ model: User, as: 'commenter', attributes: ['id', 'username', 'profile_picture_url'] }],
        },
        {
            model: Comment,
            as: 'replies',
            include: [{ model: User, as: 'commenter', attributes: ['id', 'username', 'profile_picture_url'] }],
        }
      ]
    });
    if (!comment) {
      const error = new Error('Comment not found.');
      error.statusCode = 404;
      throw error;
    }
    return comment;
  }
}

module.exports = new CommentService();