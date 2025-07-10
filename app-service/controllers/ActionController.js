'use strict';

const moment = require('moment');
const to = require('await-to-js').default;
const HttpUtil = require('../../utils/http');
const Utils = require('../../utils');
const BaseController = require('../../Base');
const Activity = require('../models/Activity');
const Customer = require('../models/Customer');
const Device = require('../models/Device');
const Image = require('../models/Image');
const Boost = require('../models/Boost');
const Reason = require('../models/Reason');
const ReasonAccount = require('../models/ReasonAccount');
const Report = require('../models/Report');
const ReportAccount = require('../models/ReportAccount');
const MessageBot = require('../models/MessageBot');
const ServiceChannel = require('../services/channels');
const Message = require('../models/Message');
const { pushCloudMessaging } = require('../services/firebase');
const Events = require('../databases/events');
const {
  actions,
  isFreeRuntime,
  timeDurationBoost,
  numLimitedLikes,
} = require('../../config');
const ServiceSocket = require('../../admin-service/services/socket');
const { text } = require('body-parser');

class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.model = Activity;
    this.mCustomer = Customer;
    this.mBoost = Boost;
    this.mReason = Reason;
    this.mReport = Report;
    this.mImage = Image;
    this.requireParams = ['interactorId'];
    this.service = ServiceChannel;
    this.mReasonAccount = ReasonAccount;
    this.mReportAccount = ReportAccount;
    this.mMessage = Message;
    this.serviceSk = ServiceSocket;
    this.mMessageBot = MessageBot;
    this.mDevice = Device;
  }

  async handle(authUser, params, actionType) {
    let obj = {
      interactorId: params.interactorId,
      agentId: authUser._id,
      promptImageId: params.promptImageId,
      typeOrder: params.type,
    };
    let objectFilter = {
      interactorId: params.interactorId,
      agentId: authUser._id,
      typeOrder: params.type,
    };

    let [err, rs] = await to(this.model.getOne(objectFilter));
    if (err) throw Error(err.message || err);
    if (!rs) {
      [err, rs] = await to(
        this.model.insertOne({ ...obj, actionType }, authUser),
      );
    } else {
      [err, rs] = await to(
        this.model.replaceItem(rs._id, { ...obj, actionType }, authUser),
      );
    }
    if (err) throw Error(err.message || err);
    // call make friend
    [err, rs] = await to(this.handleFriend(authUser._id, params.interactorId));
    if (err) throw Error(err.message || err);

    return rs;
  }

  async handleFriend(agentId, interactorId) {
    let isMatched = false;
    let conds = {
      actionType: { $ne: actions.nope },
      $or: [
        { agentId: agentId, interactorId: interactorId },
        { agentId: interactorId, interactorId: agentId },
      ],
    };
    let [err, rs] = await to(this.model.find(conds));
    if (err) throw Error(err.message || err);
    if (rs && rs.length > 1) isMatched = true;
    console.log('rs', rs.length);
    console.log('isMatched', isMatched);
    await this.service.makeFriend(agentId, interactorId, isMatched);
    return isMatched;
  }

  /**
   * Chức năng Nope user
   * @param {*} req
   * @param {*} res
   * @returns
   */
  async nope(req, res) {
    const requireParams = [
      { name: 'interactorId', dataType: 'string', acceptEmpty: true },
    ];

    let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);

    let rs;
    let err;
    [err, rs] = await to(this.handle(req.authUser, params, actions.nope));
    if (err) return HttpUtil.internalServerError(res, err.message || err);
    return HttpUtil.success(res, { isMatched: rs }, 'Success.general');
  }

  async getNumLikeRemaining(authUser) {
    let today = moment().startOf('day');
    let tomorrow = moment(today).endOf('day');
    let cond = {
      agentId: authUser._id,
      actionType: actions.like,
      'insert.when': { $gte: today, $lt: tomorrow },
    };
    let [err, count] = await to(this.model.getCount(cond));
    if (err) throw Error(err.message || err);
    return numLimitedLikes - count;
  }

  /**
   * Chức năng Like user
   * @param {*} req
   * @param {*} res
   * @returns
   * Update by: nvduc
   */
  async like(req, res) {
    let { language = 'en' } = req.headers;

    // Check interactorId
    const requireParams = [
      { name: 'interactorId', dataType: 'string', acceptEmpty: true },
      { name: 'promptImageId', dataType: 'string', acceptEmpty: true },
      { name: 'type', dataType: 'number', acceptEmpty: true }, // 0: Image, 1: Prompt, 2: User
    ];
    // console.log(req.body);

    let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);

    // let [err, interactorId] = await to(this.validateReq(req));
    // if (err) return HttpUtil.badRequest(res, err.message || err);

    let err;
    let authUser = req.authUser;
    let likeRemaining = numLimitedLikes;
    if (!isFreeRuntime && (!authUser.package || !authUser.package._id)) {
      [err, likeRemaining] = await to(this.getNumLikeRemaining(authUser));
      if (err) return HttpUtil.internalServerError(res, err.message || err);
    }
    if (likeRemaining < 1) {
      return HttpUtil.unprocessable(
        res,
        'You have used up the limited number of likes every day',
      );
    }
    likeRemaining -= 1;
    let rs;

    [err, rs] = await to(this.handle(authUser, params, actions.like));
    if (err) return HttpUtil.internalServerError(res, err.message || err);

    const isMatched = rs;

    if (isMatched) {
      let listDevice = await this.mDevice.getListByUserId(params.interactorId);
      let devices = [];
      for (let index = 0; index < listDevice.length; index++) {
        const element = listDevice[index];
        devices.push(element.fcmToken);
      }
      let messageBot = await this.mMessageBot.getListMessageBot();
      console.log('devices', devices);
      // console.log('messageBot', messageBot);
      // console.log('language', language);

      let result = this.getContentMatchLanguage(messageBot, language);
      console.log('result', result);
      await to(
        pushCloudMessaging(devices, result.contentTitle, result.contentBody, {
          clientID: authUser._id,
          fullName: authUser.fullname,
        }),
      );
    }
    ServiceSocket.emitEventUserHasNewLikes(
      params.interactorId,
      'like',
      isMatched,
    );
    return HttpUtil.success(
      res,
      { isMatched, likeRemaining, isFreeRuntime },
      'Success.general',
    );
  }

  async superLike(req, res) {
    let [err, interactorId] = await to(this.validateReq(req));
    if (err) return HttpUtil.badRequest(res, err.message || err);

    let authUser = req.authUser;
    let { numberSuperLike = 0, numberSuperLikeBonus = 0 } = authUser;
    if (!isFreeRuntime && numberSuperLike + numberSuperLikeBonus == 0) {
      return HttpUtil.unprocessable(res, "You don't have a super like");
    }

    let obj = { interactorId: interactorId, agentId: authUser._id };
    let rs;
    [err, rs] = await to(this.model.getOne(obj));
    if (err) return HttpUtil.internalServerError(res, err.message || err);

    let actionType = actions.superLike;
    if (!rs) {
      [err, rs] = await to(this.model.insertOne({ ...obj, actionType }));
    } else {
      [err, rs] = await to(
        this.model.replaceItem(rs._id, { ...obj, actionType }),
      );
    }
    if (err) return HttpUtil.internalServerError(res, err.message || err);
    if (!isFreeRuntime) {
      let updateCus = {};
      if (numberSuperLikeBonus) {
        numberSuperLikeBonus -= 1;
        updateCus = { numberSuperLikeBonus };
      } else {
        numberSuperLike -= 1;
        updateCus = { numberSuperLike };
      }
      await this.mCustomer.updateOne(authUser._id, updateCus);
    }
    let superLikeRemaining = numberSuperLikeBonus + numberSuperLike;
    // call make friend
    [err, rs] = await to(this.handleFriend(authUser._id, interactorId));
    if (err) return HttpUtil.internalServerError(res, err.message || err);
    const isMatched = rs;
    ServiceSocket.emitEventUserHasNewLikes(
      interactorId,
      'super_like',
      isMatched,
    );
    return HttpUtil.success(
      res,
      { isMatched, superLikeRemaining, isFreeRuntime },
      'Success.general',
    );
  }

  async back(req, res) {
    // bỏ nope
    let [err, interactorId] = await to(this.validateReq(req));
    if (err) return HttpUtil.badRequest(res, err.message || err);

    let authUser = req.authUser;
    if (!isFreeRuntime && (!authUser.package || !authUser.package._id)) {
      return HttpUtil.unprocessable(res, 'You have no right to go back');
    }
    let obj = {
      interactorId: interactorId,
      agentId: authUser._id,
      actionType: actions.nope,
    };
    let rs;
    [err, rs] = await to(this.model.getOne(obj));
    if (err) return HttpUtil.internalServerError(res, err.message || err);
    if (!rs)
      return HttpUtil.unprocessable(
        res,
        'You have not nope with this card yet',
      );

    [err, rs] = await to(this.model.deleteById(rs._id));
    if (err) return HttpUtil.internalServerError(res, err.message || err);
    return HttpUtil.success(res, 'Success.general');
  }

  async validateReq(req) {
    let params = HttpUtil.getRequiredParamsFromJson2(req, this.requireParams);
    if (params.error) throw Error(params.error);

    let { interactorId } = params;
    let authUser = req.authUser;
    if (String(authUser._id) === String(interactorId)) {
      throw Error('The person interacting must be different from the agent');
    }
    let [err, user] = await to(this.mCustomer.getById(interactorId));
    if (err) throw Error(err.message || err);
    if (!user) throw Error('User not found: ' + interactorId);
    return interactorId;
  }

  async boost(req, res) {
    let { number = 1 } = req.body;
    number = parseInt(number);
    if (!Utils.isNumber(number))
      return this.throwBadRequest(res, `Param 'number' must be a number`);
    if (number < 1)
      return this.throwBadRequest(res, `Param 'number' must be greater than 0`);
    let authUser = req.authUser;
    let { numberBooster = 0, numberBoosterBonus = 0 } = authUser;
    if (!isFreeRuntime && numberBooster + numberBoosterBonus < number) {
      return HttpUtil.unprocessable(res, "You don't have enough boosts");
    }
    const boostInfo = {
      duration: timeDurationBoost * number,
      startTime: moment(),
      endTime: moment().add(timeDurationBoost * number, 'seconds'),
    };
    let customer = authUser._id;
    let [err, ret] = await to(
      this.mBoost.getOne({ customer, endTime: { $gt: moment() } }),
    );
    if (err) return HttpUtil.internalServerError(res, err.message || err);
    if (ret)
      return HttpUtil.unprocessable(
        res,
        "You don't use boost during this time",
      );
    ret = await this.mBoost.insertOne({ customer, ...boostInfo });
    if (ret) {
      ret = Boost.getFields(ret);
      let updateBoost = {};
      if (!isFreeRuntime) {
        if (numberBoosterBonus >= number) {
          numberBoosterBonus -= number;
          updateBoost = { numberBoosterBonus };
        } else {
          number = number - numberBoosterBonus;
          numberBoosterBonus = 0;
          numberBooster -= number;
          updateBoost = { numberBoosterBonus, numberBooster };
        }
      }
      updateBoost = { ...updateBoost, boostInfo };
      await this.mCustomer.updateOne(authUser._id, updateBoost);
    }
    let boostRemaining = numberBoosterBonus + numberBooster;
    return HttpUtil.success(
      res,
      { ...ret, boostRemaining, isFreeRuntime },
      'Success.general',
    );
  }

  async report(req, res) {
    // const requireParams = ['userId', 'reasonId'];

    const requireParams = [
      { name: 'reportedSubjectId', dataType: 'string', acceptEmpty: true },
      { name: 'reasonCode', dataType: 'string', acceptEmpty: true },
    ];

    // const optionParams = ["reasonDetail", "comments"];
    let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return this.throwBadRequest(res, params.error);
    let authUser = req.authUser;
    let {
      agentReportId = authUser._id,
      reportedSubjectId,
      reasonCode,
      codeTitle = '',
      codeDetail = '',
      imageReports = [],
      comments = '',
    } = params;
    let err, user, reason, ret;
    [err, user] = await to(this.mCustomer.getById(reportedSubjectId));
    if (err) return this.throwBadRequest(res, err);
    if (!user)
      return this.throwBadRequest(res, 'User not found: ' + reportedSubjectId);

    [err, reason] = await to(this.mReasonAccount.getByIdsCode(reasonCode));
    if (err) return this.throwBadRequest(res, err);
    if (!reason)
      return this.throwBadRequest(res, 'Reason not found: ' + reasonId);

    let obj = {
      agentReportId,
      reportedSubjectId,
      reasonCode,
      codeTitle,
      codeDetail,
      imageReports,
      comments,
    };
    [err, ret] = await to(this.mReportAccount.insertOne(obj));
    if (err) return this.throwInternalError(res, err);
    return HttpUtil.success(res, ret, 'Success.general');
  }

  async unmatch(req, res) {
    const requireParams = ['userId'];
    let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return this.throwBadRequest(res, params.error);

    let { userId } = params;
    let authUser = req.authUser;
    if (Utils.compareString(authUser._id, userId)) {
      return this.throwBadRequest(res, 'User must be different from auth user');
    }
    let [err, user] = await to(this.mCustomer.getById(userId));
    if (err) return this.throwBadRequest(res, err);
    if (!user) return this.throwBadRequest(res, 'User not found: ' + userId);

    let channel = await this.service.checkFriend(authUser._id, userId);
    if (!channel || !channel.isMatched)
      return this.throwBadRequest(res, `You are not macth with ${userId}`);
    let rs = await this.service.removeFriend(channel);
    return HttpUtil.success(res, 'Success.general');
  }

  getContentMatchLanguage(langs, langKey) {
    const contentTitle = langs[2].langs[langKey];
    const contentBody = langs[3].langs[langKey];

    return { contentTitle, contentBody };
  }

  getMessage(langs, langKey, fullname) {
    // Get the message template from the langs object
    let messageTemplate = langs[langKey];

    // Replace the placeholder with the actual fullname
    let message = messageTemplate.replace('${fullname}', fullname);

    return message;
  }

  async matchUserByBot(req, res) {
    let { language = 'en' } = req.headers;
    let isMatched = true;

    const requireParams = [
      { name: 'idBot', dataType: 'string', acceptEmpty: true },
    ];
    let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);
    //
    let authUser = req.authUser;
    let senderId = params.idBot;
    let channel = await this.service.matchFriendBot(
      authUser._id,
      senderId,
      isMatched,
    );
    let messageBot = await this.mMessageBot.getListMessageBot();
    let langs = messageBot[0].langs;

    let resultLangMes = this.getMessage(langs, language, authUser.fullname);

    console.log('resultLangMes', resultLangMes);
    if (!channel) {
      let exitChannel = await this.service.checkExitsChannelId(
        authUser._id,
        senderId,
      );
      if (exitChannel) {
        let { channelId } = exitChannel;
        const message = {
          text: resultLangMes,
          image: '',
          icons: [],
          reacts: [],
        };
        let ret = await this.mMessage.insertOne({
          channelId,
          senderId,
          message,
        });

        console.log('ret');

        Events.activateChannel(exitChannel);
        Events.summaryMessageByChannel(exitChannel);
        this.serviceSk.emitMessageCreated(ret, exitChannel);
      }
    }

    return HttpUtil.success(res, 'Success.Match Bot');
  }
}

module.exports = new Controller();
