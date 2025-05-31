"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    static associate(models) {
      Comment.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "commenter",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      Comment.belongsTo(models.Post, {
        foreignKey: "post_id",
        as: "post",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      Comment.hasMany(models.Comment, {
        foreignKey: "parent_comment_id",
        as: "replies",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      Comment.belongsTo(models.Comment, {
        foreignKey: "parent_comment_id",
        as: "parentComment",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }
  Comment.init(
    {
      post_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "user_posts",
          key: "id",
        },
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      parent_comment_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "post_comments",
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "Comment",
      tableName: "post_comments",
    }
  );
  return Comment;
};
