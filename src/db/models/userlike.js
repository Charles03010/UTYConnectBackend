"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UserLike extends Model {
    static associate(models) {
      UserLike.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      UserLike.belongsTo(models.Post, {
        foreignKey: "post_id",
        as: "post",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }
  UserLike.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      post_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "user_posts",
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "UserLike",
      tableName: "user_likes",
      timestamps: true,
    }
  );
  return UserLike;
};
