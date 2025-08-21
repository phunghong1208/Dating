'use strict';

const Router = require('../libs/Router');
// Middleware
const middleware = require('../middleware');
const ExtendResponse = middleware.extendResponse;
// header validation
const header_validation = require('../routes/header_validation');
// Controllers
const ctrlFriend = require('../controllers/FriendController');
const ctrlChatBox = require('../controllers/IndexController');

/**
 * Application routes
 */
module.exports = app => {
  app.use(header_validation);
  app.use(ExtendResponse);
  let router = new Router();
  
  router.group({ prefix: '/api/v1', middlewares: [middleware.app]}, router => {
    
      // ==================== FRIEND MANAGEMENT ====================
    // Lấy danh sách tất cả friends/matches của user
    router.get('/friends', ctrlFriend.index);
    
    // Lấy danh sách friends mới (recent matches)
    router.get('/friends/new', ctrlFriend.listsByNew);
    
    // ==================== CHANNEL MANAGEMENT ====================
    // Lấy channel ID để tạo kết nối chat với một user
    router.get('/getChannelId', ctrlChatBox.getChannelId);
    
    // Lấy danh sách tất cả channels/chat rooms của user
    router.get('/channels', ctrlChatBox.getChannels);
    
    // Xóa một channel/chat room khỏi inbox
    router.put('/channels/:chatId/remove', ctrlChatBox.removeInbox);
    
    // ==================== MESSAGE MANAGEMENT ====================
    // Lấy tất cả messages trong một channel/chat room
    router.get('/channels/:chatId/messages', ctrlChatBox.getMessages);
    
    // Thêm message mới vào channel cụ thể
    router.post('/channels/:chatId/add-message', ctrlChatBox.addMessage);
    
    // Gửi message mới (tự động tạo channel nếu chưa có)
    router.post('/messages/add', ctrlChatBox.sendMessage);
    
    // Chỉnh sửa nội dung message theo ID
    router.put('/messages/:msgId/edit', ctrlChatBox.editMessage);
    
    // Xóa message theo ID
    router.put('/messages/:msgId/remove', ctrlChatBox.removeMessage);
    
    // Cập nhật trạng thái message (đã đọc, đã gửi, etc.)
    router.post('/messages/update-status', ctrlChatBox.updateStatus);  router.get('/friends', ctrlFriend.index);
    
    // Lấy danh sách friends mới (recent matches)
    router.get('/friends/new', ctrlFriend.listsByNew);
    
    // ==================== CHANNEL MANAGEMENT ====================
    // Lấy channel ID để tạo kết nối chat với một user
    router.get('/getChannelId', ctrlChatBox.getChannelId);
    
    // Lấy danh sách tất cả channels/chat rooms của user
    router.get('/channels', ctrlChatBox.getChannels);
    
    // Xóa một channel/chat room khỏi inbox
    router.put('/channels/:chatId/remove', ctrlChatBox.removeInbox);
    
    // ==================== MESSAGE MANAGEMENT ====================
    // Lấy tất cả messages trong một channel/chat room
    router.get('/channels/:chatId/messages', ctrlChatBox.getMessages);
    
    // Thêm message mới vào channel cụ thể
    router.post('/channels/:chatId/add-message', ctrlChatBox.addMessage);
    
    // Gửi message mới (tự động tạo channel nếu chưa có)
    router.post('/messages/add', ctrlChatBox.sendMessage);
    
    // Chỉnh sửa nội dung message theo ID
    router.put('/messages/:msgId/edit', ctrlChatBox.editMessage);
    
    // Xóa message theo ID
    router.put('/messages/:msgId/remove', ctrlChatBox.removeMessage);
    
    // Cập nhật trạng thái message (đã đọc, đã gửi, etc.)
    router.post('/messages/update-status', ctrlChatBox.updateStatus);
  });
  
  router = router.init();
  app.use(router);
};
