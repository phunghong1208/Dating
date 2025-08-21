'use strict';

const to = require('await-to-js').default;
const HttpUtil = require('../utils/http');
const DBUtils = require('../utils/Database');
const Utils = require('../utils');
const BaseController = require('../Base');
const Channel = require('../models/Channel');
const Message = require('../models/Message');
const User = require('../models/User');
const ServiceSocket = require('../../services/socket');

class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.model = Message;
    this.mChannel = Channel;
    this.mUser = User;
    this.serviceSk = ServiceSocket;
    this.requireParams = ['receiverId'];
  }

  async getMessages(req, res) {
    let userId = req.authUser._id;
    let channelIds = await this.mChannel.getIdsByClientId(userId);
    if (!channelIds || !channelIds.length) {
      return HttpUtil.badRequest(res, 'Not found my channel');
    }
    let channelId = channelIds[0];
    let { currentPage, pageSize, filters, sorting } = req.query;
    currentPage = currentPage ? parseInt(currentPage) : 0;
    pageSize = pageSize ? parseInt(pageSize) : 500;
    let sorts = sorting || { 'insert.when': -1 };
    let inputs = { pageSize, currentPage, sorts };
    let [err, rs] = await to(
      this.model.getMessagesForChannel(channelId, userId, inputs),
    );
    if (err) return HttpUtil.badRequest(res, err.message || err);
    let { lists, total } = rs;
    if (lists && lists.length) {
      let userIds = lists.map(it => it.senderId);
      let mapUsers = await this.mUser.buildMapUsers(userIds);
      lists = lists.map(it => {
        let obj = Utils.cloneObject(it);
        obj.sender = mapUsers[obj.senderId] || {};
        obj.isPartner = obj.senderId !== userId;
        return obj;
      });
    }
    let ret = DBUtils.paginationResult(lists, total, inputs);
    return HttpUtil.success(res, ret);
  }

  async sendMessage(req, res) {
    let requireParams = [
      'text',
      { name: 'image', dataType: 'string', acceptEmpty: true },
      { name: 'icons', dataType: 'array', acceptEmpty: true },
      { name: 'reacts', dataType: 'array', acceptEmpty: true },
    ];
    let params = HttpUtil.getRequiredParams2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);

    let senderId = req.authUser._id;
    let channels = await this.mChannel.getByClientId(senderId);
    if (!channels || !channels.length) {
      return HttpUtil.badRequest(res, 'Not found my channel');
    }
    let channel = channels[0];
    let { channelId } = channel;
    let { ...message } = params;
    let ret = await this.model.insertOne({ channelId, senderId, message });
    if (ret) {
      ret = Utils.cloneObject(ret);
      let authUser = req.authUser;
      let { _id, name, email, phone, address } = authUser;
      ret.sender = { _id, name, email, phone, address };
    }
    this.serviceSk.emitMessageCreated(ret, channel);
    return HttpUtil.success(res, { record: ret });
  }

  async testEventSocket(req, res) {
    let { eventName, message } = req.body;
    this.serviceSk.emitEvent(eventName, message);
    return HttpUtil.success(res, { eventName, data: message });
  }
}

module.exports = new Controller();
