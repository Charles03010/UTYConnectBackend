"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Chat extends Model {
    static associate(models) {
      Chat.belongsTo(models.User, {
        foreignKey: "user1_id",
        as: "user1",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      Chat.belongsTo(models.User, {
        foreignKey: "user2_id",
        as: "user2",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      Chat.hasMany(models.ChatMessage, {
        foreignKey: "chat_id",
        as: "messages",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }
  Chat.init(
    {
      user1_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      user2_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        validate: {
          notSameUser(value) {
            if (this.user1_id === value) {
              throw new Error(
                "user1_id and user2_id cannot be the same for a chat."
              );
            }
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Chat",
      tableName: "user_chats",
      indexes: [
        {
          unique: true,
          fields: ["user1_id", "user2_id"],
        },
      ],
    }
  );
  return Chat;
};
