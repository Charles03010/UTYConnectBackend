"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    async isValidPassword(password) {
      return bcrypt.compare(password, this.password);
    }

    static associate(models) {
      
      User.hasMany(models.Post, {
        foreignKey: "user_id",
        as: "posts",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      
      User.hasMany(models.Comment, {
        foreignKey: "user_id",
        as: "comments",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      
      User.belongsToMany(models.Post, {
        through: models.UserLike,
        foreignKey: "user_id",
        otherKey: "post_id",
        as: "likedPosts",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      
      User.belongsToMany(models.Post, {
        through: models.UserSave,
        foreignKey: "user_id",
        otherKey: "post_id",
        as: "savedPosts",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      
      User.belongsToMany(models.User, {
        through: models.UserFollow,
        foreignKey: "follower_id", 
        otherKey: "following_id", 
        as: "following", 
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      
      User.belongsToMany(models.User, {
        through: models.UserFollow,
        foreignKey: "following_id", 
        otherKey: "follower_id", 
        as: "followers", 
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      
      User.hasMany(models.Chat, {
        foreignKey: "user1_id",
        as: "chatsAsUser1",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      
      User.hasMany(models.Chat, {
        foreignKey: "user2_id",
        as: "chatsAsUser2",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      
      User.hasMany(models.ChatMessage, {
        foreignKey: "sender_id",
        as: "sentMessages",
        onDelete: "CASCADE", 
        onUpdate: "CASCADE",
      });

      
      User.hasMany(models.ChatMessage, {
        foreignKey: "receiver_id",
        as: "receivedMessages",
        onDelete: "CASCADE", 
        onUpdate: "CASCADE",
      });
    }
  }
  User.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      profile_picture_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users", 
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("password") && user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    }
  );
  return User;
};
