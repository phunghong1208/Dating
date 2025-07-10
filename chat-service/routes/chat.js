'use strict';

const express = require('express');
const router = express.Router();

// Mock controllers - bạn sẽ implement thực tế sau
const ctrlFriend = {
  index: (req, res) => res.json({ message: 'Get all friends endpoint' }),
  listsByNew: (req, res) => res.json({ message: 'Get new friends endpoint' }),
};

const ctrlChatBox = {
  getChannelId: (req, res) => res.json({ message: 'Get channel ID endpoint' }),
  getChannels: (req, res) => res.json({ message: 'Get all channels endpoint' }),
  removeInbox: (req, res) => res.json({ message: 'Remove inbox endpoint' }),
  getMessages: (req, res) => res.json({ message: 'Get messages endpoint' }),
  addMessage: (req, res) => res.json({ message: 'Add message endpoint' }),
  sendMessage: (req, res) => res.json({ message: 'Send message endpoint' }),
  editMessage: (req, res) => res.json({ message: 'Edit message endpoint' }),
  removeMessage: (req, res) => res.json({ message: 'Remove message endpoint' }),
  updateStatus: (req, res) => res.json({ message: 'Update message status endpoint' }),
};

/**
 * Chat Service routes
 */
module.exports = app => {
  // ==================== FRIEND MANAGEMENT ====================
  app.get('/api/v1/friends', ctrlFriend.index);
  app.get('/api/v1/friends/new', ctrlFriend.listsByNew);
  
  // ==================== CHANNEL MANAGEMENT ====================
  app.get('/api/v1/getChannelId', ctrlChatBox.getChannelId);
  app.get('/api/v1/channels', ctrlChatBox.getChannels);
  app.put('/api/v1/channels/:chatId/remove', ctrlChatBox.removeInbox);
  
  // ==================== MESSAGE MANAGEMENT ====================
  app.get('/api/v1/channels/:chatId/messages', ctrlChatBox.getMessages);
  app.post('/api/v1/channels/:chatId/add-message', ctrlChatBox.addMessage);
  app.post('/api/v1/messages/add', ctrlChatBox.sendMessage);
  app.put('/api/v1/messages/:msgId/edit', ctrlChatBox.editMessage);
  app.put('/api/v1/messages/:msgId/remove', ctrlChatBox.removeMessage);
  app.post('/api/v1/messages/update-status', ctrlChatBox.updateStatus);
}; 