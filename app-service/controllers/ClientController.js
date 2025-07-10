'use strict';

const to = require('await-to-js').default;
const AuthUtil = require('../../utils/auth');
const HttpUtil = require('../../utils/http');
const DBUtils = require('../../utils/Database');
const Utils = require('../../utils');
const BaseController = require('../../Base');
const Customer = require('../models/Customer');
const Image = require('../models/Image');
const Activity = require('../models/Activity');
const Channel = require('../models/Channel');
const HistoryProfile = require('../models/HistoryProfile');
const PromptAnswer = require('../models/PromptAnswer');

const { verifyUID } = require('../services/firebase');
const { verifyFaceID } = require('../services/ai');
const { isFreeRuntime, timeDurationBoost, numLimitedLikes } = require('../../config');
const AvatarConfigs = require('../../config').avatars;

class AuthController extends BaseController {
  constructor() {
    super(AuthController);
    this.model = Customer;
    this.imageModel = Image;
    this.promptModel = PromptAnswer;
    this.historyProfileModel = HistoryProfile;
    this.mActivity = Activity;
    this.mChannel = Channel;
  }

  /**
   * Đăng ký account
   * @param {*} req
   * @param {*} res
   * @returns
   */
  async register(req, res) {
    let { language = 'en' } = req.headers;
    const requireParams = [
      'oAuth2Id',
      'fullname',
      'dob',
      'profiles.gender',
      'location.lat',
      'location.long',
    ];

    const optionParams = [
      { name: 'profiles.avatars', dataType: 'array', acceptEmpty: false },
      { name: 'profiles.prompts', dataType: 'array', acceptEmpty: true },
      { name: 'profiles.address', dataType: 'string', acceptEmpty: true },
      {
        name: 'profiles.orientationSexuals',
        dataType: 'array',
        acceptEmpty: true,
      },
      { name: 'profiles.interests', dataType: 'array', acceptEmpty: true },
      { name: 'profiles.showCommon.showGender', dataType: 'boolean' },
      { name: 'profiles.showCommon.showSexual', dataType: 'boolean' },
      { name: 'profiles.showCommon.showHeight', dataType: 'boolean' },
      { name: 'profiles.showCommon.showEthnicity', dataType: 'boolean' },
      { name: 'profiles.showCommon.showFamilyPlan', dataType: 'boolean' },
      { name: 'profiles.showCommon.showChildrenPlan', dataType: 'boolean' },
      { name: 'profiles.showCommon.showWork', dataType: 'boolean' },
      { name: 'profiles.showCommon.showSchool', dataType: 'boolean' },
      { name: 'profiles.showCommon.showEducation', dataType: 'boolean' },
      { name: 'profiles.showCommon.showDrinking', dataType: 'boolean' },
      { name: 'profiles.showCommon.showSmoking', dataType: 'boolean' },
      { name: 'profiles.showCommon.showDrug', dataType: 'boolean' },
      { name: 'profiles.height', dataType: 'number' }, // Chiều cao
      { name: 'profiles.ethnicitys', dataType: 'array', acceptEmpty: true }, // dân tộc
      { name: 'profiles.childrenPlan', dataType: 'string', acceptEmpty: true }, // Kế hoạch trẻ em
      { name: 'profiles.familyPlan', dataType: 'string', acceptEmpty: true }, // Kế hoạch gia đình
      { name: 'profiles.company', dataType: 'string', acceptEmpty: true }, // Công viêc
      { name: 'profiles.school', dataType: 'string', acceptEmpty: true }, // trường
      { name: 'profiles.education', dataType: 'string', acceptEmpty: true }, // giáo dục
      { name: 'profiles.drinking', dataType: 'string', acceptEmpty: true }, // uống rượu
      { name: 'profiles.smoking', dataType: 'string', acceptEmpty: true }, // Hút thuốc
      { name: 'profiles.drug', dataType: 'string', acceptEmpty: true }, // Hút ma túy
    ];

    // let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
    let params = HttpUtil.getRequiredParamsFromJson2(req, [
      ...requireParams,
      ...optionParams,
    ]);
    if (params.error) return HttpUtil.badRequest(res, params.error);
    params = Utils.getAcceptableFields(params, [
      ...requireParams,
      ...optionParams,
    ]);

    params = this.handleProfileSetting(params);

    const { oAuth2Id, fullname, dob, profiles: profiles, location } = params;

    let [err, data] = await to(verifyUID(oAuth2Id));
    if (err) return HttpUtil.unauthorized(res, JSON.parse(err.message));
    let { phoneNumber, email } = data;
    let user;
    let msgErr = { msg: 'Unique.customer.email', words: email },
      condition = { email: email };
    if (phoneNumber) {
      condition = { phone: phoneNumber };
      msgErr = { msg: 'Unique.customer.phone', words: phoneNumber };
    }

    [err, user] = await to(
      this.model.getOne(DBUtils.excludeSoftDelete({ oAuth2Id: data.uid })),
    );

    if (err)
      return HttpUtil.internalServerError(res, {
        msg: 'Found_Errors.user',
        words: err.message,
      });

    if (user)
      return HttpUtil.unprocessable(res, {
        msg: 'Unique.customer.oAuth2Id',
        words: email || phoneNumber,
      });

    [err, user] = await to(
      this.model.getOne(DBUtils.excludeSoftDelete(condition)),
    );
    if (err)
      return HttpUtil.internalServerError(res, {
        msg: 'Found_Errors.user',
        words: err.message,
      });
    if (user) return HttpUtil.unprocessable(res, msgErr);

    let obj = {
      oAuth2Id: data.uid,
      fullname,
      email,
      phone: phoneNumber,
      dob,
      location,
      languageMachine: language,
      profiles: profiles,
      settings: {},
      explore: { topics: [] },
      packages: {},
    };

    console.log('Register account', obj);
    [err, user] = await to(this.model.insertOne(obj));
    if (err)
      return HttpUtil.internalServerError(res, {
        msg: 'Errors.register',
        words: err.message,
      });

    user = Utils.cloneObject(user);
    user = Customer.getFields(user);
    let token = AuthUtil.generateJwtApp(user);

    /*insert user images*/
    if (profiles.avatars && profiles.avatars?.length > 0) {
      const newImageArr = [];
      for (let i = 0; i < profiles.avatars.length; i++) {
        newImageArr.push({
          id: Utils.generateULID(),
          meta: {
            url: profiles.avatars[i]?.meta?.url,
            thumbnails: [profiles.avatars[i]?.meta?.thumbnails[0]],
          },
          reviewerStatus: 0, // 0: pending / 1: accepted / 2: rejected
          order: i,
          comment: '',
          reviewerViolateOption: [],
          aiStatus: 0,
          isVerified: false,
          aiViolateOption: [],
          aiPoint: 0,
          insert: {
            when: Date.now(),
          },
        });
      }
      const objImage = {
        avatars: newImageArr,
        userId: user._id,
      };
      const [errImage, image] = await to(
        this.imageModel.insertObject(objImage),
      );

      if (errImage) {
        console.log('register insert image error', errImage);
      } else {
        console.log('image success');
      }
    }

    /*insert user prompt */
    if (profiles.prompts && profiles.prompts?.length > 0) {
      const newPromptArray = [];
      for (let i = 0; i < profiles.prompts.length; i++) {
        newPromptArray.push({
          id: Utils.generateULID(),
          codePrompt: profiles.prompts[i].codePrompt,
          answer: profiles.prompts[i].answer,
          order: i,
          insert: {
            when: Date.now(),
          },
        });
      }
      const objPrompt = {
        promptAnswers: newPromptArray,
        userId: user._id,
      };
      const [errPromptAnswer, promptAnswer] = await to(
        this.promptModel.insertObject(objPrompt),
      );

      if (errPromptAnswer) {
        console.log('register insert prompt answer error', errPromptAnswer);
      } else {
        console.log('answer success');
      }
    } else {
      const objPrompt = {
        promptAnswers: [],
        userId: user._id,
      };
      const [err, promptAnswer] = await to(
        this.promptModel.insertObject(objPrompt),
      );
      if (err) {
        console.log('register insert prompt answer error', err);
      } else {
        console.log('answer success');
      }
    }

    if (user) {
      // Import thêm thông tin image & prompt khi login
      let resultPrompt = await this.promptModel.getByIdsUserId(user._id);
      let resultImage = await this.imageModel.getByIdsUserId(user._id);
      if (resultPrompt) {
        user.profiles.prompts = [...resultPrompt.promptAnswers];
      }
      if (resultImage) {
        user.profiles.avatars = [...resultImage.avatars];
      }
    }

    return HttpUtil.success(res, { token, user }, 'Success.register');
  }

  handleProfileSetting(params) {
    let avatars = [],
      orientationSexuals = [],
      interests = [],
      favoriteSongs = [],
      languages = [];
    if (params.avatars && params.avatars.length) {
      params.avatars.map(key => {
        if (key && avatars.indexOf(key) == -1) avatars.push(key);
      });
      if (avatars.length)
        avatars = avatars.map(url => {
          return {
            id: Utils.generateULID(),
            url,
            status: AvatarConfigs.status.pending,
          };
        });
    }
    if (params.orientationSexuals && params.orientationSexuals.length) {
      params.orientationSexuals.map(key => {
        if (key && orientationSexuals.indexOf(key) == -1)
          orientationSexuals.push(key);
      });
    }
    if (params.interests && params.interests.length) {
      params.interests.map(key => {
        if (key && interests.indexOf(key) == -1) interests.push(key);
      });
    }
    if (params.languages && params.languages.length) {
      params.languages.map(key => {
        if (key && languages.indexOf(key) == -1) languages.push(key);
      });
    }
    if (params.favoriteSongs && params.favoriteSongs.length) {
      params.favoriteSongs.map(key => {
        if (key && favoriteSongs.indexOf(key) == -1) favoriteSongs.push(key);
      });
    }
    return {
      ...params,
      avatars,
      orientationSexuals,
      interests,
      favoriteSongs,
      languages,
    };
  }

  /**
   * Login app
   * @param {*} req
   * @param {*} res
   * @returns
   */
  async login(req, res) {
    const requireParams = ['oAuth2Id'];
    let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);

    let { oAuth2Id } = params;
    let [err, user] = await to(verifyUID(oAuth2Id));
    // Update trạng thái online
    if (user) {
      await this.model.updateItem({ oAuth2Id: user.uid }, { onlineNow: true });
    }

    if (err) return HttpUtil.unauthorized(res, JSON.parse(err.message));

    [err, user] = await to(
      this.model.getOne(DBUtils.excludeSoftDelete({ oAuth2Id: user.uid }), {
        projection: {},
        lookup: true,
      }),
    );

    if (user) {
      if (user.block) {
        let unlockTime = user.block.when;
        const timestamp = new Date(unlockTime).getTime();
        let now = Date.now();

        if (now < timestamp) {
          return HttpUtil.forbidden(res, `Account is locked!`, {
            toDate: unlockTime,
            disable: user.disable,
          });
        }
      }
    }

    // Import thêm thông tin image & prompt khi login
    if (user) {
      let resultPrompt = await this.promptModel.getByIdsUserId(user._id);

      let resultImage = await this.imageModel.getByIdsUserId(user._id);

      if (resultPrompt) {
        user.profiles.prompts = [...resultPrompt.promptAnswers];
      }
      if (resultImage) {
        user.profiles.avatars = [...resultImage.avatars];
      }
    }

    if (err) return HttpUtil.unauthorized(res, err);
    if (!user || user.delete) {
      return HttpUtil.unprocessable(res, {
        msg: 'Not_Exists.user',
        words: oAuth2Id,
      });
    }
    // if (user.disable) {
    //   return HttpUtil.unprocessable(res, 'Disable_Login');
    // }

    let token = AuthUtil.generateJwtApp(user);
    [
      'hash',
      'salt',
      '__v',
      'update',
      'insert',
      'disable',
      'lastPasswordChange',
    ].forEach(field => delete user[field]);

    console.log('Login success', user);
    return HttpUtil.success(res, { token, user }, 'Success.login');
  }

  /**
   * Logout account: Chưa check hết case
   * @param {*} req
   * @param {*} res
   * @returns
   */
  async logout(req, res) {
    const requireParams = req.body.userId;

    let [err, user] = await to(
      this.model.updateOne(requireParams, { onlineNow: false }),
    );
    if (err) {
      return HttpUtil.internalServerError(res, {
        msg: 'Found_Errors.user',
        words: err.message,
      });
    }
    return HttpUtil.success(res, 'Success.general');
  }

  async refreshToken(req, res) {
    let params = HttpUtil.getRequiredParamsFromJson2(req, ['refreshToken']);
    if (params.error) return HttpUtil.badRequest(res, params.error);

    let [err, user] = await to(
      this.model.getOne(
        { _id: params.refreshToken },
        { projection: {}, lookup: true },
      ),
    );
    if (err) {
      return HttpUtil.internalServerError(res, {
        msg: 'Found_Errors.user',
        words: err.message,
      });
    }
    if (!user || user.delete) {
      return HttpUtil.unprocessable(res, {
        msg: 'Not_Exists.user',
        words: params.userId,
      });
    }
    if (user.disable) {
      return HttpUtil.unprocessable(res, 'Disable_Login');
    }
    let token = AuthUtil.generateJwtApp(user);
    return HttpUtil.success(res, { token }, 'Success.general');
  }

  async getProfile(req, res) {
    let authUser = req.authUser;
    if (!authUser || !authUser._id) {
      return HttpUtil.unauthorized(res, 'unauthorized');
    }

    if (authUser) {
      let resultPrompt = await this.promptModel.getByIdsUserId(authUser._id);

      let resultImage = await this.imageModel.getByIdsUserId(authUser._id);

      if (resultPrompt) {
        authUser.profiles.prompts = [...resultPrompt.promptAnswers];
      }
      if (resultImage) {
        authUser.profiles.avatars = [...resultImage.avatars];
      }
    }

    return HttpUtil.success(res, authUser);
  }

  async updateGPS(req, res) {
    let params = HttpUtil.getRequiredParamsFromJson2(req, [
      'location.lat',
      'location.long',
    ]);
    if (params.error) return HttpUtil.badRequest(res, params.error);

    let { location } = params;
    let authUser = req.authUser;
    let [err, result] = await to(
      this.model.updateOne(authUser._id, { location }, {}, authUser),
    );
    if (err)
      return HttpUtil.internalServerError(res, {
        msg: 'Errors.update',
        words: err.message,
      });

    return HttpUtil.success(res, 'Success.update');
  }

  async updatelanguageMachine(req, res) {
    let params = HttpUtil.getRequiredParamsFromJson2(req, ['languageMachine']);
    if (params.error) return HttpUtil.badRequest(res, params.error);

    let { languageMachine } = params;
    let authUser = req.authUser;
    let [err, result] = await to(
      this.model.updateOne(authUser._id, { languageMachine }, {}, authUser),
    );
    if (err)
      return HttpUtil.internalServerError(res, {
        msg: 'Errors.update',
        words: err.message,
      });

    return HttpUtil.success(res, 'Success.update');
  }

  async updateProfile(req, res) {
    const requireParams = [
      { name: 'profiles.about', dataType: 'string', acceptEmpty: true },
      { name: 'profiles.gender', dataType: 'string' },
      {
        name: 'profiles.orientationSexuals',
        dataType: 'array',
        acceptEmpty: true,
      },
      { name: 'profiles.interests', dataType: 'array', acceptEmpty: true },
      { name: 'profiles.address', dataType: 'string', acceptEmpty: true },
      { name: 'profiles.showCommon.showAge', dataType: 'boolean' },
      { name: 'profiles.showCommon.showDistance', dataType: 'boolean' },
      { name: 'profiles.avatars', dataType: 'array', acceptEmpty: false },
    ];
    const optionParams = [
      'language',
      { name: 'profiles.height', dataType: 'number' },
      { name: 'profiles.showCommon.showSexual', dataType: 'boolean' },
      { name: 'profiles.showCommon.showGender', dataType: 'boolean' },
      { name: 'profiles.showCommon.showHeight', dataType: 'boolean' },
      { name: 'profiles.showCommon.showEthnicity', dataType: 'boolean' },
      { name: 'profiles.showCommon.showFamilyPlan', dataType: 'boolean' },
      { name: 'profiles.showCommon.showChildrenPlan', dataType: 'boolean' },
      { name: 'profiles.showCommon.showSchool', dataType: 'boolean' },
      { name: 'profiles.showCommon.showEducation', dataType: 'boolean' },
      { name: 'profiles.showCommon.showDrinking', dataType: 'boolean' },
      { name: 'profiles.showCommon.showSmoking', dataType: 'boolean' },
      { name: 'profiles.showCommon.showDrug', dataType: 'boolean' },

      { name: 'profiles.childrenPlan', dataType: 'string', acceptEmpty: true },

      { name: 'profiles.zodiac', dataType: 'string', acceptEmpty: true },
      { name: 'profiles.education', dataType: 'string', acceptEmpty: true },
      { name: 'profiles.familyPlan', dataType: 'number', acceptEmpty: true },
      { name: 'profiles.covidVaccine', dataType: 'string', acceptEmpty: true },
      { name: 'profiles.personality', dataType: 'string', acceptEmpty: true },
      {
        name: 'profiles.communicationType',
        dataType: 'string',
        acceptEmpty: true,
      },
      { name: 'profiles.loveStyle', dataType: 'string', acceptEmpty: true },

      { name: 'profiles.pet', dataType: 'string', acceptEmpty: true },
      { name: 'profiles.drinking', dataType: 'string', acceptEmpty: true },
      { name: 'profiles.smoking', dataType: 'string', acceptEmpty: true },
      { name: 'profiles.workout', dataType: 'string', acceptEmpty: true },
      {
        name: 'profiles.dietaryPreference',
        dataType: 'string',
        acceptEmpty: true,
      },
      { name: 'profiles.socialMedia', dataType: 'string', acceptEmpty: true },
      { name: 'profiles.sleepingHabit', dataType: 'string', acceptEmpty: true },

      { name: 'profiles.ethnicitys', dataType: 'string', acceptEmpty: true },
      { name: 'profiles.smartPhoto', dataType: 'boolean' },
      { name: 'profiles.drug', dataType: 'string', acceptEmpty: true },

      { name: 'profiles.languages', dataType: 'array', acceptEmpty: false },
      { name: 'profiles.datingPurpose', dataType: 'string', acceptEmpty: true },
      { name: 'profiles.school', dataType: 'string', acceptEmpty: true },
      { name: 'profiles.company', dataType: 'string', acceptEmpty: true },
      { name: 'profiles.jobTitle', dataType: 'string', acceptEmpty: true },
      { name: 'profiles.favoriteSongs', dataType: 'array', acceptEmpty: true },
    ];
    let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);

    params = Utils.getAcceptableFields(params, [
      ...requireParams,
      ...optionParams,
    ]);
    params = this.handleProfileSetting(params);
    // handle avatars
    // let avatars = params.avatars || [];
    // let mapOldAvatar = {};
    let authUser = req.authUser;

    let [err, result] = await to(this.imageModel.getByIdsUserId(authUser._id));

    if (result) {
      const newImageArr = [];
      for (let i = 0; i < params.profiles.avatars.length; i++) {
        const objImage = {
          id: params.profiles.avatars[i].id
            ? params.profiles.avatars[i].id
            : Utils.generateULID(),
          meta: {
            url: params.profiles.avatars[i]?.meta?.url,
            thumbnails: [params.profiles.avatars[i]?.meta?.thumbnails[0]],
          },
          reviewerStatus: params.profiles.avatars[i].reviewerStatus
            ? params.profiles.avatars[i].reviewerStatus
            : 0, // 0: pending / 1: accepted / 2: rejected
          order: i,
          comment: '',
          isVerified: params.profiles.avatars[i].isVerified
            ? params.profiles.avatars[i].isVerified
            : false,
          reviewerViolateOption:
            params.profiles.avatars[i].reviewerViolateOption.length > 0
              ? params.profiles.avatars[i].reviewerViolateOption
              : [],
          aiStatus: params.profiles.avatars[i].aiStatus
            ? params.profiles.avatars[i].aiStatus
            : 0,
          aiViolateOption:
            params.profiles.avatars[i].aiViolateOption.length > 0
              ? params.profiles.avatars[i].aiViolateOption
              : [],
          aiPoint: params.profiles.avatars[i].aiPoint
            ? params.profiles.avatars[i].aiPoint
            : 0,
        };
        if (params.profiles.avatars[i].id) {
          objImage.update = {
            when: Date.now(),
          };
        } else {
          objImage.insert = {
            when: Date.now(),
          };
        }
        newImageArr.push(objImage);
      }
      const objImage = {
        avatars: newImageArr,
      };
      let [err, resultData] = await to(
        this.imageModel.updateOne(result._id, objImage),
      );
    }
    // if (authUser.profiles.avatars && authUser.profiles.avatars.length) {
    //   authUser.profiles.avatars.map(item => {
    //     mapOldAvatar[item.url] = item;
    //   });
    // }
    // avatars = avatars.map(item => {
    //   if (mapOldAvatar[item.url]) return mapOldAvatar[item.url];
    //   return item;
    // });
    let explore = {
      verified: 0,
    };
    let findData = params.profiles.avatars.find(x => x.isVerified === true);
    if (findData) explore.verified = 2;

    if (authUser.explore.verified === -1) {
      explore.verified = -1;
    }
    if (authUser.explore.verified === 1) {
      explore.verified = 1;
    }
    let profiles = { ...authUser.profiles, ...params.profiles };
    let exploreNew = { ...authUser.explore, ...explore };

    [err, result] = await to(
      this.model.updateOne(
        authUser._id,
        { profiles: profiles, explore: exploreNew },
        {},
        authUser,
      ),
    );
    if (err)
      return HttpUtil.internalServerError(res, {
        msg: 'Errors.update',
        words: err.message,
      });

    return HttpUtil.success(res, 'Success.update');
  }

  async updateSetting(req, res) {
    const requireParams = [
      { name: 'settings.genderFilter', dataType: 'string' },
      { name: 'settings.distancePreference.range', dataType: 'number' },
      { name: 'settings.distancePreference.unit', dataType: 'string' },
      {
        name: 'settings.distancePreference.onlyShowInThis',
        dataType: 'boolean',
      },
      { name: 'settings.agePreference.min', dataType: 'number' },
      { name: 'settings.agePreference.max', dataType: 'number' },
      { name: 'settings.agePreference.onlyShowInThis', dataType: 'boolean' },
      { name: 'settings.global.isEnabled', dataType: 'boolean' },
      { name: 'settings.incognitoMode', dataType: 'boolean' },
    ];
    const optionParams = [
      'location.lat',
      'location.long',
      { name: 'profiles.address', dataType: 'string' },
      {
        name: 'settings.global.languages',
        dataType: 'array',
        acceptEmpty: true,
      },
      { name: 'settings.showActiveStatus', dataType: 'boolean' },
      { name: 'settings.showOnlineStatus', dataType: 'boolean' },

      { name: 'settings.notiSeenEmail.newMatchs', dataType: 'boolean' },
      { name: 'settings.notiSeenEmail.incomingMessage', dataType: 'boolean' },
      { name: 'settings.notiSeenEmail.promotions', dataType: 'boolean' },
      { name: 'settings.notiSeenApp.newMatchs', dataType: 'boolean' },
      { name: 'settings.notiSeenApp.incomingMessage', dataType: 'boolean' },
      { name: 'settings.notiSeenApp.promotions', dataType: 'boolean' },
      { name: 'settings.notiSeenApp.superLike', dataType: 'boolean' },

      { name: 'settings.autoPlayVideo', dataType: 'string' },
      { name: 'plusCtrl.whoYouSee', dataType: 'string' },
      { name: 'plusCtrl.whoSeeYou', dataType: 'string' },

      { name: 'activeStatus', dataType: 'boolean' },
    ];
    let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);

    params = Utils.getAcceptableFields(params, [
      ...requireParams,
      ...optionParams,
    ]);

    let { profiles, activeStatus, plusCtrl, location, settings } = params;

    // let { language, location, address, plusCtrl, ...settings } = params;
    let authUser = req.authUser;
    // let profiles = { ...authUser.profiles, address };
    // if (language) profiles.language = language;
    profiles = { ...authUser.profiles, ...profiles };
    settings = { ...authUser.settings, ...settings };

    // console.log(profiles);
    let updateInfo = { settings, profiles, activeStatus, location, plusCtrl };
    // if (location && location.lat && location.long)
    //   updateInfo.location = location;
    // if (plusCtrl && Utils.isObject(plusCtrl)) {
    //   updateInfo.plusCtrl = authUser.plusCtrl;
    //   if (Utils.objectHasProperty(plusCtrl, 'whoYouSee')) {
    //     if (!whoYouSeeTypes[plusCtrl.whoYouSee]) {
    //       return HttpUtil.badRequest(
    //         res,
    //         `Param 'plusCtrl.whoYouSee' must be ${Object.values(
    //           whoYouSeeTypes,
    //         )}`,
    //       );
    //     }
    //     updateInfo.plusCtrl.whoYouSee = plusCtrl.whoYouSee;
    //   }
    //   if (Utils.objectHasProperty(plusCtrl, 'whoSeeYou')) {
    //     if (!whoSeeYouTypes[plusCtrl.whoSeeYou]) {
    //       return HttpUtil.badRequest(
    //         res,
    //         `Param 'plusCtrl.whoSeeYou' must be ${Object.values(
    //           whoSeeYouTypes,
    //         )}`,
    //       );
    //     }
    //     updateInfo.plusCtrl.whoSeeYou = plusCtrl.whoSeeYou;
    //   }
    // }

    let [err, result] = await to(
      this.model.updateOne(authUser._id, updateInfo, {}, authUser),
    );

    if (err)
      return HttpUtil.internalServerError(res, {
        msg: 'Errors.update',
        words: err.message,
      });
    return HttpUtil.success(res, 'Success.update');
  }

  async getMetadata(req, res) {
    let authUser = req.authUser;
    let { query } = req.query;
    let ret = { query: false };
    if (query) {
      ret = {};
      let arr = query.split(',');
      let {
        fullname,
        email,
        phone,
        dob,
        profiles,
        numberBooster,
        numberSuperLike,
        numberBoosterBonus,
        numberSuperLikeBonus,
      } = authUser;
      if (arr.indexOf('account') > -1) {
        ret.account = { fullname, email, phone, dob, gender: profiles.gender };
      }
      if (arr.indexOf('action') > -1) {
        ret = {
          ...ret,
          isFreeRuntime,
          numLimitedLikes,
          timeDurationBoost,
          superLikeRemaining: numberSuperLikeBonus + numberSuperLike,
          boostRemaining: numberBoosterBonus + numberBooster,
        };
      }
      if (arr.indexOf('package') > -1) {
        ret.package = authUser.package;
      }
      if (arr.indexOf('explore') > -1) {
        ret.explore = authUser.explore;
      }
    }
    return HttpUtil.success(res, ret);
  }

  async delete(req, res) {
    let authUser = req.authUser;

    let [err, result] = await to(
      this.mActivity.updateManyArray(
        {
          interactorId: authUser._id,
        },
        {
          $set: {
            // Sử dụng $set để thiết lập trường "delete"
            delete: {
              when: Date.now(),
              by: authUser._id,
            },
          },
        },
      ),
    );
    // [err, result] = await to(
    //   this.mChannel.updateManyArray(
    //     {
    //       clientIds: { $in: [authUser._id] },
    //     },
    //     {
    //       $set: {
    //         // Sử dụng $set để thiết lập trường "delete"
    //         delete: {
    //           when: Date.now(),
    //           by: authUser._id,
    //         },
    //       },
    //     },
    //   ),
    // );
    [err, result] = await to(this.model.softDeletes({ _id: authUser._id }));
    if (err)
      return HttpUtil.internalServerError(res, {
        msg: 'Errors.delete',
        words: err.message,
      });
    return HttpUtil.success(res, 'Success.delete');
  }

  async verifyAccount(req, res) {
    const requireParams = [
      { name: 'images', dataType: 'array', acceptEmpty: false },
    ];
    let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);
    let [err, data] = await to(verifyFaceID(params.images, req.authUser));

    if (err) return HttpUtil.internalServerError(res, err.message || err);

    if (data === true) {
      console.log('Data da nhan', data);
      ServiceSocket.emitEventUserVerified(req.authUser._id, { verified: 1 });
      return HttpUtil.success(res, 'Success.verify');
    }
    if (data === false) {
      console.log('URL bị tu choi', data);
      ServiceSocket.emitEventUserVerified(req.authUser._id, { verified: -1 });
      return HttpUtil.success(res, 'Success.verifyFalse');
    }
    if (data === '201') {
      console.log('URL dang xác thưc', data);
      ServiceSocket.emitEventUserVerified(req.authUser._id, { verified: 1 });
      return HttpUtil.success(res, 'Success.verify');
    }
    if (data === '401') {
      console.log('UserId khong ton tai', data);
      return HttpUtil.notFound(res, 'Found_Errors.user');
    }
  }

  async purchaseCoins(req, res) {}
}

module.exports = new AuthController();
