// src/api/chats/chats.controller.js
const chatService = require('./chats.service');
const { validationResult } = require('express-validator');

class ChatController {
  async getOrCreateChat(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Validation failed.');
      err.statusCode = 400;
      err.errors = errors.array();
      return next(err);
    }
    try {
      const { userId2 } = req.body; // ID of the other user to chat with
      const chat = await chatService.getOrCreateChat(req.user.id, parseInt(userId2));
      res.status(200).json(chat); // 200 if exists, 201 if created (service can return this info)
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Validation failed.');
      err.statusCode = 400;
      err.errors = errors.array();
      return next(err);
    }
    try {
      const chatId = parseInt(req.params.chatId);
      const { message: messageText } = req.body;
      const message = await chatService.sendMessage(chatId, req.user.id, messageText);
      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  }

  async getMessagesForChat(req, res, next) {
     const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Validation failed.');
      err.statusCode = 400;
      err.errors = errors.array();
      return next(err);
    }
    try {
      const chatId = parseInt(req.params.chatId);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 30;
      const messagesData = await chatService.getMessagesForChat(chatId, req.user.id, page, limit);
      res.status(200).json(messagesData);
    } catch (error) {
      next(error);
    }
  }

  async getUserChats(req, res, next) {
    try {
      const chats = await chatService.getUserChats(req.user.id);
      res.status(200).json(chats);
    } catch (error) {
      next(error);
    }
  }

  async markMessagesAsRead(req, res, next) {
    try {
        const chatId = parseInt(req.params.chatId);
        const result = await chatService.markMessagesAsRead(chatId, req.user.id);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
  }
}

module.exports = new ChatController();