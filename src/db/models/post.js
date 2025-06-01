"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Post extends Model {
    static associate(models) {
      Post.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "author",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      Post.hasMany(models.Comment, {
        foreignKey: "post_id",
        as: "comments",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      Post.belongsToMany(models.User, {
        through: models.UserLike,
        foreignKey: "post_id",
        otherKey: "user_id",
        as: "likedByUsers",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      Post.belongsToMany(models.User, {
        through: models.UserSave,
        foreignKey: "post_id",
        otherKey: "user_id",
        as: "savedByUsers",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }
  Post.init(
    {
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      image_url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      caption: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Post",
      tableName: "user_posts",
    }
  );
  return Post;
};
