// src/api/chats/chats.routes.js
const express = require('express');
const chatController = require('./chats.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');
const { body, param, query } = require('express-validator');

const router = express.Router();

// Get all chats for the authenticated user
router.get('/', authenticateToken, chatController.getUserChats);

// Get or create a chat with another user
router.post(
  '/',
  authenticateToken,
  [
    body('userId2').isInt().withMessage('User ID of the other participant is required and must be an integer.'),
  ],
  chatController.getOrCreateChat
);

// Get messages for a specific chat
router.get(
  '/:chatId/messages',
  authenticateToken,
  [
    param('chatId').isInt().withMessage('Chat ID must be an integer.'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
  ],
  chatController.getMessagesForChat
);

// Send a message in a chat
router.post(
  '/:chatId/messages',
  authenticateToken,
  [
    param('chatId').isInt().withMessage('Chat ID must be an integer.'),
    body('message').notEmpty().withMessage('Message text cannot be empty.').trim().isLength({ max: 2000 }),
  ],
  chatController.sendMessage
);

// Mark messages in a chat as read
router.patch(
  '/:chatId/messages/read',
  authenticateToken,
  [
    param('chatId').isInt().withMessage('Chat ID must be an integer.'),
  ],
  chatController.markMessagesAsRead
);


module.exports = router;