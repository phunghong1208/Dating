'use strict';

const Router = require('../libs/Router');
// Middleware
const middleware = require('../middleware');
const ExtendResponse = middleware.extendResponse;
// header validation
const header_validation = require('../routes/header_validation');
// Controllers
const ctrlClient = require('../controllers/ClientController');
const ctrlCard = require('../controllers/CardController');
const ctrlInteract = require('../controllers/InteractController');
const ctrlAction = require('../controllers/ActionController');
const ctrlStatic = require('../controllers/StaticController');
const ctrlGuest = require('../controllers/GuestController');
const ctrImage = require('../controllers/ImageController');
const ctrPrompt = require('../controllers/PromptController');

/**
 * Application routes
 */
module.exports = app => {
  app.use(header_validation);
  app.use(ExtendResponse);
  let router = new Router();
  
  // TODO Routes not require authenticate
  router.group({ prefix: '/api/v1' }, router => {
    
    // ==================== AUTHENTICATION APIs ====================
    // Đăng ký tài khoản mới - tạo user account với email/password
    router.post('/register', ctrlClient.register);
    
    // Đăng nhập vào hệ thống - xác thực và trả về token
    router.post('/login', ctrlClient.login);
    
    // Làm mới access token khi token cũ hết hạn
    router.post('/refreshToken', ctrlClient.refreshToken);
    
    // ==================== GUEST APIs (Không cần đăng nhập) ====================
    router.group('/guest', router => {
      // Lấy thông tin tĩnh cho khách (genders, interests, etc.)
      router.get('/statics', ctrlGuest.getStaticInfos);
      
      // Lấy danh sách prompts cho khách xem
      router.get('/prompts', ctrlGuest.getStaticPrompts);
      
      // Lấy danh sách địa điểm/areas cho khách
      router.get('/areas', ctrlGuest.getLocations);
    });
    
    // ==================== AUTHENTICATED APIs (Cần đăng nhập) ====================
    router.group({ middlewares: [middleware.app] }, router => {
      
      // ==================== USER MANAGEMENT ====================
      // Đăng xuất khỏi hệ thống - xóa session/token
      router.post('/logout', ctrlClient.logout);
      
      // Lấy thông tin profile chi tiết của user hiện tại
      router.get('/profile', ctrlClient.getProfile);
      
      // Cập nhật thông tin profile (name, age, bio, etc.)
      router.post('/profile', ctrlClient.updateProfile);
      
      // Cập nhật cài đặt cá nhân (notifications, privacy, etc.)
      router.post('/setting', ctrlClient.updateSetting);
      
      // Cập nhật vị trí GPS của user để tính khoảng cách
      router.post('/updateGPS', ctrlClient.updateGPS);
      
      // Cập nhật ngôn ngữ máy để hiển thị đúng ngôn ngữ
      router.post('/update-language-machine', ctrlClient.updatelanguageMachine);
      
      // Xóa tài khoản user vĩnh viễn
      router.delete('/users/delete', ctrlClient.delete);
      
      // Xác thực tài khoản (email verification, phone verification)
      router.post('/users/verify', ctrlClient.verifyAccount);
      
      // Lấy metadata của profile (statistics, preferences)
      router.get('/profile/meta', ctrlClient.getMetadata);
      
      // ==================== IMAGE MANAGEMENT ====================
      // Lấy tất cả ảnh profile của user
      router.get('/image/profile', ctrImage.getProfileImage);
      
      // Xóa một ảnh profile theo ID
      router.delete('/image/profile', ctrImage.deleteProfileImage);
      
      // Thêm ảnh profile mới
      router.post('/image/profile', ctrImage.addProfileImage);
      
      // Cập nhật thông tin ảnh profile
      router.put('/image/profile', ctrImage.updateProfileImage);
      
      // Thay đổi thứ tự hiển thị của các ảnh profile
      router.post('/image/profileChangeOrder', ctrImage.changeProfileImageOrder);
      
      // ==================== CARD/MATCHING SYSTEM ====================
      // Lấy danh sách cards để swipe (users để like/nope)
      router.get('/cards', ctrlCard.index);
      
      // Lấy ảnh của cards để hiển thị
      router.get('/cards-image', ctrlCard.getCardImage);
      
      // Lấy danh sách user được recommend bởi AI
      router.get('/cards/recommends', ctrlCard.getRecommends);
      
      // Lấy danh sách user đã được verify (có tick xanh)
      router.get('/cards/verified', ctrlCard.getVerifiedLists);
      
      // Lấy danh sách user theo topic/group cụ thể
      router.get('/cards/group/:topicId', ctrlCard.getListsForGroup);
      
      // Lấy thông tin chi tiết của một user theo ID
      router.get('/cards/:id', ctrlCard.getUserProfile);
      
      // ==================== TOPIC/GROUP MANAGEMENT ====================
      // Tham gia vào một topic/group
      router.put('/topics/:topicId', ctrlCard.joinTopic);
      
      // Rời khỏi topic/group
      router.post('/topics/:topicId/out', ctrlCard.outTopic);
      
      // ==================== INTERACTION TRACKING ====================
      // Lấy danh sách user đã like bạn (người thích bạn)
      router.get('/list-action-you', ctrlInteract.listUserOtherLikeYou);
      
      // Lấy danh sách user bạn đã like (bạn thích ai)
      router.get('/list-you-action', ctrlInteract.listYouLikeOtherUser);
      
      // Lọc danh sách user theo điều kiện like cụ thể
      router.post('/list-fillter-like', ctrlInteract.listUserLikeFilter);
      
      // ==================== SWIPE ACTIONS ====================
      // Nope (không thích) một user - swipe left
      router.post('/nope', ctrlAction.nope);
      
      // Like một user - swipe right
      router.post('/like', ctrlAction.like);
      
      // Super like một user - đánh dấu đặc biệt
      router.post('/superLike', ctrlAction.superLike);
      
      // Quay lại user trước đó - undo action
      router.post('/back', ctrlAction.back);
      
      // Boost profile để tăng khả năng match trong 30 phút
      router.post('/boost', ctrlAction.boost);
      
      // Báo cáo user vi phạm
      router.post('/report', ctrlAction.report);
      
      // Hủy match với user (unmatch)
      router.post('/unmatch', ctrlAction.unmatch);
      
      // Match với bot user (AI matching)
      router.post('/match-bot', ctrlAction.matchUserByBot);
      
      // ==================== STATIC DATA ====================
      // Lấy thông tin tĩnh chung (genders, interests, etc.)
      router.get('/statics/commons', ctrlStatic.getStaticInfos);
      
      // Lấy thông tin cơ bản (basic info)
      router.get('/statics/basics', ctrlStatic.getBasicInfos);
      
      // Lấy danh sách lý do report
      router.get('/statics/reason', ctrlStatic.getReasonInfos);
      
      // Lấy thông tin lifestyle (workout, smoking, etc.)
      router.get('/statics/life-styles', ctrlStatic.getLifeStyles);
      
      // Import lý do từ admin (chức năng admin)
      router.post('/import-reason', ctrlStatic.importReason);
      
      // Lấy danh sách reasons để report
      router.get('/reasons', ctrlStatic.getReasons);
      
      // Lấy danh sách topics/groups
      router.get('/topics', ctrlStatic.getTopics);
      
      // Lấy danh sách packages (premium features)
      router.get('/packages', ctrlStatic.getPackages);
      
      // ==================== PROMPT SYSTEM ====================
      // Cập nhật câu trả lời cho prompt
      router.post('/profile/prompts', ctrPrompt.updatePromptAnswer);
      
      // Xóa câu trả lời prompt theo ID
      router.delete('/profile/prompts', ctrPrompt.deletePromptAnswerById);
    });
  });
  
  router = router.init();
  app.use(router);
};
