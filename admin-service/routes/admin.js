'use strict';

const Router = require('../libs/Router');
const { _crud } = require('./handle');
const { roles } = require('../../config');


const ctrlAuth = require('../controllers/AuthController');
const ctrlAccount = require('../controllers/AccountController');
const ctrlUser = require('../controllers/UserController');
const ctrlUserDisabled = require('../controllers/UserDisabledController');
const ctrlProfile = require('../controllers/ProfileController');
const ctrlArea = require('../controllers/AreaController');
const ctrlPackage = require('../controllers/PackageController');
const ctrlJob = require('../controllers/JobController');
const ctrlCustomer = require('../controllers/CustomerController');
const ctrlActivity = require('../controllers/ActivityController');
const ctrlBoost = require('../controllers/BoostController');
const ctrlPayment = require('../controllers/PaymentController');
const ctrlSchool = require('../controllers/SchoolCtrl');
const ctrlJobTitle = require('../controllers/JobTitleCtrl');
const ctrlReason = require('../controllers/ReasonCtrl');
const ctrlReasonAccount = require('../controllers/ReasonAccountCtrl');
const ctrlReport = require('../controllers/ReportCtrl');
const StaticCtrl = require('../controllers/StaticCtrl');
const ctrlSexual = new StaticCtrl('Sexual');
const ctrlInterest = new StaticCtrl('Interest');
const ctrlGender = new StaticCtrl('Gender');
const ctrlLanguage = new StaticCtrl('Language');
const ctrlApproveImage = require('../controllers/ApproveImageCtrl');
const ctrlMessage = require('../controllers/MessageController');

const ctrlPrompt = require('../controllers/PromptCtrl');

const ctrlClient = require('../controllers/AI/ClientController');
// Controller Devops
const ctrlCronJob = require('../controllers/Devops/CronController');
const ctrlDevOps = require('../controllers/Devops/DevController');
const ctrlTest = require('../controllers/Devops/TestController');
const ctrlIterate = require('../controllers/Devops/IterateController');
// Controller ChatBox
//const ctrlDevChat = require('../controllers/Chat/DevController');

// Customer User
const ctrlCustomerUser = require('../controllers/CustomerUserController');

// Middleware
const middleware = require('../middleware');
const ExtendResponse = middleware.extendResponse;
// header validation
const header_validation = require('../routes/header_validation');
const requireRoot = { middlewares: [middleware.role(roles.root)] };
const requireAdmin = { middlewares: [middleware.role(roles.admin)] };
const requireOperator = {
  middlewares: [middleware.role(roles.admin, roles.operator)],
};

/**
 * Application routes
 */
module.exports = app => {
  app.use(header_validation);
  app.use(ExtendResponse);

  function crud(entities, controller, options = {}) {
    let [uri, routes] = _crud(entities, controller, options);
    app.use(uri, routes);
  }

  let router = new Router();
  // TODO Routes not require authenticate
  router.group({ prefix: '/api' }, router => {
    // Route authentication
    router.post('/login', ctrlAuth.login);
    router.post('/iterate', ctrlIterate.run);
    // Routes ai
    router.group('/ai', router => {
      router.group('/clients', router => {
        router.get('/:uid', ctrlClient.getProfileWithoutAuth);
        router.post('/verified', ctrlClient.verified);
        router.post('/smart-photo', ctrlClient.aiUpdatePhotos);
        router.post('/update-avatar-ai', ctrlClient.aiUpdateStatusImage);
      });
    });

    // Routes test
    router.group('/test', router => {
      router.post('/verify-token-id', ctrlTest.verifyTokenId);
      router.post('/send-tinder-otp', ctrlTest.getTinderOtpCode);
      router.post('/fetch-tinder-cards', ctrlTest.fetchCards);
      router.post('/get-owner-tinder', ctrlTest.getOwnerTinder);
      router.post('/get-user-tinder', ctrlTest.getUserTinder);
      router.post(
        '/tinder/get-available-descriptors',
        ctrlTest.getAvailableDescriptors,
      );
      router.post(
        '/tinder/clone-avaiable-descriptors',
        ctrlTest.cloneAvaiableDescriptors,
      );
      router.post('/tinder/clone-interests', ctrlTest.cloneInterests);
      router.get('/clients/:id/sockets', ctrlTest.getSessionSokets);
    });
    // TODO Required authentication
    router.group({ middlewares: [middleware.auth] }, router => {
      // TODO Routes all roles
      router.get('/logout', ctrlAuth.logout);
      // Route password
      router.post('/change-password', ctrlAuth.changePassword);
      // Route profile
      router.get('/profile', ctrlProfile.getProfile);
      // Routes dev chatbox
      // router.group({ prefix: '/dev' }, router => {
      //   router.get('/messages', ctrlDevChat.getMessages);
      //   router.post('/messages/add', ctrlDevChat.sendMessage);
      //   router.post('/test-events', ctrlDevChat.testEventSocket);
      // });

      // TODO Routes roles = [roles.root, roles.admin]
      router.group(
        { middlewares: [middleware.role(roles.root, roles.admin)] },
        router => {
          // Routes password
          // router.post('/reset-password', ctrlAuth.resetPassword);
          router.put('/reset-password/:userId', ctrlAuth.resetDefaultPassword);
          router.put('/lock-account/:userId', ctrlAuth.lockAccount);
          router.put('/unlock-account/:userId', ctrlAuth.unlockAccount);
          // Routes cron jobs
          router.post('/cron/start', ctrlCronJob.startJob);
          router.post('/cron/stop', ctrlCronJob.stopJob);
          // Router devops
          router.group({ prefix: '/dev' }, router => {
            router.get('/channels/:chatId', ctrlDevOps.getDetailChannel);
            router.get('/check-dup-channels', ctrlDevOps.checkDupChannels);
            router.get('/check-activities', ctrlDevOps.checkActivities);
            router.get('/check-data-reports', ctrlDevOps.checkDataReports);
            router.get('/check-data-boost', ctrlDevOps.checkDataBoost);
            router.get('/clean-session-sk', ctrlDevOps.cleanSessionSockets);
            router.post(
              '/iterate-user-channels',
              ctrlDevOps.iterateSummaryUserChannel,
            );
            router.post(
              '/iterate-activated-channels',
              ctrlDevOps.iterateActivatedChannel,
            );
            router.post('/iterate', ctrlIterate.run);
          });
        },
      );

      // TODO Routes role = roles.admin
      router.group(requireAdmin, router => {
        // Routes users
        router.get('/users', ctrlUser.index);
        router.get('/users/getRoles', ctrlUser.getRoles);
        router.post('/users', ctrlUser.store);
        router.param('userId', ctrlUser.load);
        router.get('/users/:userId', ctrlUser.detail);
        router.put('/users/:userId', ctrlUser.update);
        router.delete('/users/:userId', ctrlUser.destroy);
        router.post('/users/deleteMulti', ctrlUser.deleteMulti);
        // Routes users disable
        router.get('/users-disabled', ctrlUserDisabled.index);
        router.param('uid', ctrlUserDisabled.load);
        router.put('/users-disabled/:uid', ctrlUserDisabled.update);
        router.delete('/users-disabled/:uid', ctrlUserDisabled.destroy);
      });

      router.group(requireOperator, router => {
        // Customer user clone
        router.get(
          '/card-customer-user',
          ctrlCustomerUser.getListCardCustomerUser,
        );
        router.delete(
          '/delete-meta-customer-user',
          ctrlCustomerUser.deletePropertyCustomerUser,
        );
        router.post(
          '/upload-customer-user',
          ctrlCustomerUser.postInformationCustomerUser,
        );
        router.post(
          '/upload-common-user',
          ctrlCustomerUser.postCommonCustomerUser,
        );
        router.post(
          '/upload-image-user',
          ctrlCustomerUser.postManyAvatarByUserId,
        );
        router.post(
          '/import-image-user',
          ctrlCustomerUser.importDataCustomerAndImage,
        );

        // 
        router.get('/avatars', ctrlApproveImage.index);
        router.get(
          '/avatars/need-confirm-images',
          ctrlApproveImage.getNeedConfirmLists,
        );
        router.get('/avatars/card-images', ctrlApproveImage.getListCardImage);
        router.get(
          '/avatars/history-images',
          ctrlApproveImage.getListHistoryImageByUser,
        );
        router.get('/avatars/total', ctrlApproveImage.getTotalCardImagesCMS);
        router.put(
          '/avatars/:avatarId/update-avatar-status',
          ctrlApproveImage.updateStatusAvatar,
        );
        // router.put(
        //   '/avatars/:avatarId/update-avatar-status',
        //   ctrlApproveImage.manualUpdateAvatarStatus,
        // );
        router.put(
          '/avatars/:avatarId/reset-avatar-status',
          ctrlApproveImage.resetAvatarStatus,
        );
        // Route customers
        router.get('/customers', ctrlCustomer.getListCardCustomer);
        // Tool
        router.post('/upload-thumbnail', ctrlCustomer.postImageThumbnail);
        router.post(
          '/upload-information-profile',
          ctrlCustomer.postInformationCustomer,
        );
        router.post('/upload-imgae-ai', ctrlCustomer.postImageThumbnailAI);
        router.delete('/delete-image', ctrlCustomer.deleteImageThumbnail);
        router.post('/insert-avatar', ctrlCustomer.insertManyAvatarByUserId);
        router.post('/upload-common-profile', ctrlCustomer.postCommonCustomer);

        // 
        router.get('/list-massage-bot', ctrlMessage.getListReceiveMessageBot);
        router.post('/send-many-bot', ctrlMessage.postManyMessageByBot);


        //
        router.param('cusId', ctrlCustomer.load);
        router.get('/customers/:cusId', ctrlCustomer.getDetailCustomer);
        router.delete('/customers/:cusId', ctrlCustomer.destroy);
        router.put('/customers/:cusId/lock', ctrlCustomer.lock);
        router.put('/customers/:cusId/unlock', ctrlCustomer.unlock);
        router.post('/customers/block', ctrlReport.blockAccount);
        router.post('/customers/unlock', ctrlReport.unlockAccount);
        router.get('/list-report', ctrlReport.getListReportAccount);
        router.get('/static/reason-account', ctrlReasonAccount.getListReasonAccount);
        router.get('/static/common', ctrlReasonAccount.getCommonCtrl);
        router.get('/static/basic-infos', ctrlReasonAccount.getBasicInfosCtrl);
        router.get('/static/life-style-infos', ctrlReasonAccount.getLifeStyleInfosCtrl);
        router.get('/static/prompts', ctrlReasonAccount.getStaticPromptsCtrl);
        router.get('/list-activities', ctrlActivity.getListActivities);

        // Route cron-job
        router.get('/jobs', ctrlJob.index);
        // Route activities
        router.get('/activities', ctrlActivity.index);
        // Route boosts
        router.get('/boosts', ctrlBoost.index);
        // Route payments
        router.get('/payments', ctrlPayment.index);
        // Route reports
        router.get('/reports', ctrlReport.index);
        // Router prompt category
        router.post('/prompt-category', ctrlPrompt.updateCategory);
      });
    });
  });
  router = router.init();
  app.use(router);

  /*
    =====    Manage routes CRUD    =====
  */
  // Routes accounts admin
  crud('accounts', ctrlAccount, requireRoot);
  // Routes areas
  crud('areas', ctrlArea, requireOperator);
  // Routes packages
  crud('packages', ctrlPackage, requireOperator);
  // Routes interests
  crud('interests', ctrlInterest, requireOperator);
  // Routes jobTitles
  crud('job-titles', ctrlJobTitle, requireOperator);
  // Routes schools
  crud('schools', ctrlSchool, requireOperator);
  // Routes sexuals
  crud('sexuals', ctrlSexual, requireOperator);
  // Routes reasons
  crud('reasons', ctrlReason, requireOperator);
  // Routes genders
  crud('genders', ctrlGender, requireOperator);
  // Routes langs
  crud('languages', ctrlLanguage, requireOperator);
};
