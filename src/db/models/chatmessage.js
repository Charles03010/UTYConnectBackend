"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ChatMessage extends Model {
    static associate(models) {
      ChatMessage.belongsTo(models.Chat, {
        foreignKey: "chat_id",
        as: "chat",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      ChatMessage.belongsTo(models.User, {
        foreignKey: "sender_id",
        as: "sender",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });
    }
  }
  ChatMessage.init(
    {
      chat_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "user_chats",
          key: "id",
        },
      },
      sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },

      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.ENUM("sent", "delivered", "read"),
        allowNull: false,
        defaultValue: "sent",
      },
    },
    {
      sequelize,
      modelName: "ChatMessage",
      tableName: "chat_messages",
    }
  );
  return ChatMessage;
};
