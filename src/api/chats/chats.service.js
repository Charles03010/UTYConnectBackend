// src/api/chats/chats.service.js
const db = require('../../db/models');
const { Chat, ChatMessage, User, Sequelize } = db;
const { Op } = Sequelize;

class ChatService {
  // Get or create a chat between two users
  async getOrCreateChat(userId1, userId2) {
    if (userId1 === userId2) {
      const error = new Error('Cannot create a chat with yourself.');
      error.statusCode = 400;
      throw error;
    }

    // Ensure user1_id < user2_id to have a consistent key for the chat
    const u1 = Math.min(userId1, userId2);
    const u2 = Math.max(userId1, userId2);

    let chat = await Chat.findOne({
      where: { user1_id: u1, user2_id: u2 },
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username', 'profile_picture_url'] },
        { model: User, as: 'user2', attributes: ['id', 'username', 'profile_picture_url'] }
      ]
    });

    if (!chat) {
      chat = await Chat.create({ user1_id: u1, user2_id: u2 });
      // Re-fetch to include user details
      chat = await Chat.findByPk(chat.id, {
        include: [
            { model: User, as: 'user1', attributes: ['id', 'username', 'profile_picture_url'] },
            { model: User, as: 'user2', attributes: ['id', 'username', 'profile_picture_url'] }
        ]
      });
    }
    return chat;
  }

  // Send a message in a chat
  async sendMessage(chatId, senderId, messageText) {
    const chat = await Chat.findByPk(chatId);
    if (!chat) {
      const error = new Error('Chat not found.');
      error.statusCode = 404;
      throw error;
    }

    // Determine receiverId based on who is the sender in the chat
    const receiverId = chat.user1_id === senderId ? chat.user2_id : chat.user1_id;
    if (chat.user1_id !== senderId && chat.user2_id !== senderId) {
        const error = new Error('Sender is not part of this chat.');
        error.statusCode = 403;
        throw error;
    }


    const message = await ChatMessage.create({
      chat_id: chatId,
      sender_id: senderId,
      // receiver_id: receiverId, // receiver_id added to model for easier querying
      message: messageText,
      status: 'sent', // Default status
    });

    // For real-time, you would emit this message via WebSockets here
    return ChatMessage.findByPk(message.id, {
        include: [{model: User, as: 'sender', attributes: ['id', 'username', 'profile_picture_url']}]
    });
  }

  // Get messages for a specific chat with pagination
  async getMessagesForChat(chatId, userId, page = 1, limit = 30) {
    const chat = await Chat.findByPk(chatId);
    if (!chat) {
      const error = new Error('Chat not found.');
      error.statusCode = 404;
      throw error;
    }
    // Ensure the requesting user is part of the chat
    if (chat.user1_id !== userId && chat.user2_id !== userId) {
      const error = new Error('User not authorized to view this chat.');
      error.statusCode = 403;
      throw error;
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await ChatMessage.findAndCountAll({
      where: { chat_id: chatId },
      include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'profile_picture_url'] }],
      order: [['createdAt', 'DESC']], // Newest messages first for typical chat view
      limit,
      offset,
    });

    // Mark messages as 'delivered' or 'read' (simplified logic here)
    // For 'read', client would typically send an ACK when messages are viewed.
    // For 'delivered', if using push notifications or socket acks.
    await ChatMessage.update(
      { status: 'delivered' }, // Or 'read' if appropriate
      { where: { chat_id: chatId, sender_id: { [Op.ne]: userId }, status: 'sent' } }
    );

    return {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalMessages: count,
        messages: rows.reverse(), // Reverse to show oldest first in the current page batch
    };
  }

  // Get all chats for a user with last message
  async getUserChats(userId) {
    const chats = await Chat.findAll({
      where: {
        [Op.or]: [{ user1_id: userId }, { user2_id: userId }],
      },
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username', 'profile_picture_url', 'name'] },
        { model: User, as: 'user2', attributes: ['id', 'username', 'profile_picture_url', 'name'] },
      ],
      order: [['updatedAt', 'DESC']], // Order chats by last activity
    });

    // Enhance chats with last message and unread count
    const chatsWithDetails = await Promise.all(
      chats.map(async (chat) => {
        const chatJson = chat.toJSON();
        const lastMessage = await ChatMessage.findOne({
          where: { chat_id: chat.id },
          order: [['createdAt', 'DESC']],
          include: [{ model: User, as: 'sender', attributes: ['id', 'username'] }]
        });
        chatJson.lastMessage = lastMessage;
        chatJson.unreadCount = await ChatMessage.count({
            where: {
                chat_id: chat.id,
                sender_id: {[Op.ne]: userId }, // Messages not sent by current user
                status: {[Op.or]: ['sent', 'delivered']} // Unread messages
            }
        });
        // Determine the 'otherUser' for frontend display
        if (chatJson.user1.id === userId) {
            chatJson.otherUser = chatJson.user2;
        } else {
            chatJson.otherUser = chatJson.user1;
        }
        delete chatJson.user1; // Clean up
        delete chatJson.user2; // Clean up

        return chatJson;
      })
    );
    // Sort again after adding last message details if updatedAt isn't perfectly reflecting message time
    chatsWithDetails.sort((a, b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.updatedAt);
        const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.updatedAt);
        return timeB - timeA;
    });

    return chatsWithDetails;
  }

  async markMessagesAsRead(chatId, userId) {
    const chat = await Chat.findByPk(chatId);
    if (!chat || (chat.user1_id !== userId && chat.user2_id !== userId)) {
        const error = new Error('Chat not found or user not authorized.');
        error.statusCode = 404;
        throw error;
    }

    const [affectedCount] = await ChatMessage.update(
        { status: 'read' },
        {
            where: {
                chat_id: chatId,
                sender_id: { [Op.ne]: userId }, // Messages received by the current user
                status: { [Op.ne]: 'read' }    // Only update if not already read
            },
            // returning: true, // For PostgreSQL to get updated rows
        }
    );
    return { message: `${affectedCount} messages marked as read.` };
  }
}

module.exports = new ChatService();