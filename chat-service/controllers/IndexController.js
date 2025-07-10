'use strict';

const to = require('await-to-js').default;
const HttpUtil = require('../utils/http');
const BaseController = require('../Base');
const Customer = require('../models/Customer');
const Device = require('../models/Device');
const Message = require('../models/Message');
const ServiceChannel = require('../services/channels');
const ServiceSocket = require('../services/socket');
const { pushCloudMessaging } = require('../services/firebase');

const Utils = require('../utils');
const ConfigMsg = require('../config');
const Events = require('../events');

class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.model = Message;
    this.mCustomer = Customer;
    this.sChannel = ServiceChannel;
    this.serviceSk = ServiceSocket;
    this.mDevice = Device;
    this.requireParams = ['receiverId'];
    this.requireMsgID = ['msgId'];

    // Thêm log ở đây
    console.log('Customer model connection state (constructor):', require('mongoose').connection.readyState);
  }

  async getChannelId(req, res) {
    let params = HttpUtil.getRequiredParams2(req, this.requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);
    let [err, channelId] = await to(
      this.sChannel.getCoupleChannelId(req.authUser._id, params.receiverId),
    );
    if (err) return HttpUtil.badRequest(res, err.message || err);
    return HttpUtil.success(res, { channelId });
  }

  async getChannels(req, res) {
    let { currentPage, pageSize, filters, sorting } = req.query;
    currentPage = currentPage ? parseInt(currentPage) : 0;
    pageSize = pageSize ? parseInt(pageSize) : 500;
    let sorts = sorting || { lastActiveTime: -1 };
    let inputs = { pageSize, currentPage, sorts };
    let lists = await this.sChannel.getActiveChannels(req.authUser, inputs);
    return HttpUtil.success(res, lists);
  }

  async getMessages(req, res) {
    let channelId = req.params.chatId;
    let { currentPage, pageSize, filters, sorting } = req.query;
    currentPage = currentPage ? parseInt(currentPage) : 0;
    pageSize = pageSize ? parseInt(pageSize) : 500;
    let sorts = sorting || { 'insert.when': -1 };
    let inputs = { pageSize, currentPage, sorts };
    let [err, rs] = await to(
      this.sChannel.getMessagesForChannel(channelId, req.authUser._id, inputs),
    );
    if (err) return HttpUtil.badRequest(res, err.message || err);
    return HttpUtil.success(res, rs);
  }

  async addMessage(req, res) {
    let requireParams = [
      'chatId',
      'text',
      { name: 'image', dataType: 'string', acceptEmpty: true },
      { name: 'icons', dataType: 'array', acceptEmpty: true },
      { name: 'reacts', dataType: 'array', acceptEmpty: true },
    ];
    let params = HttpUtil.getRequiredParams2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);

    let { chatId, ...message } = params;
    let senderId = req.authUser._id;
    let senderName = req.authUser.fullname;
    let [err, channel] = await to(this.validateChannel(chatId, senderId));
    if (err) return HttpUtil.badRequest(res, err.message || err);
    let { channelId } = channel;
    let findClientId = channel.clientIds.find(x => x !== senderId);
    if (findClientId) {
      console.log('findClientId', findClientId);
    }
    let listDevice = await this.mDevice.getListByUserId(findClientId);
    let devices = [];
    for (let index = 0; index < listDevice.length; index++) {
      const element = listDevice[index];
      devices.push(element.fcmToken);
    }

    let ret = await this.model.insertOne({ channelId, senderId, message });
    await to(
      pushCloudMessaging(devices, senderName, message.text, {
        channelId: channelId,
      }),
    );

    console.log('channel', channel);
    Events.activateChannel(channel);
    Events.summaryMessageByChannel(channel);
    this.serviceSk.emitMessageCreated(ret, channel);
    return HttpUtil.success(res, { record: ret });
  }

  async sendMessage(req, res) {
    let requireParams = [
      ...this.requireParams,
      'text',
      { name: 'image', dataType: 'string', acceptEmpty: true },
      { name: 'icons', dataType: 'array', acceptEmpty: true },
      { name: 'reacts', dataType: 'array', acceptEmpty: true },
    ];
    let params = HttpUtil.getRequiredParams2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);

    let { receiverId, ...message } = params;
    let senderId = req.authUser._id;
    let [err, channel] = await to(this.validateSendMsg(receiverId, senderId));
    if (err) return HttpUtil.badRequest(res, err.message || err);
    let { channelId } = channel;
    let ret = await this.model.insertOne({ channelId, senderId, message });
    Events.activateChannel(channel);
    Events.summaryMessageByChannel(channel);
    this.serviceSk.emitMessageCreated(ret, channel);
    return HttpUtil.success(res, { record: ret });
  }

  async editMessage(req, res) {
    let requireParams = [
      ...this.requireMsgID,
      'text',
      { name: 'image', dataType: 'string', acceptEmpty: true },
      { name: 'icons', dataType: 'array', acceptEmpty: true },
      { name: 'reacts', dataType: 'array', acceptEmpty: true },
    ];
    let params = HttpUtil.getRequiredParams2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);
    let { msgId, ...message } = params;
    let record = await this.model.getById(msgId);
    if (!record) return HttpUtil.badRequest(res, `Message not found: ${msgId}`);
    if (record.senderId !== req.authUser._id) {
      return HttpUtil.badRequest(
        res,
        `You are not allowed to update this message: ${msgId}`,
      );
    }
    await this.model.updateOne(msgId, { message });
    let ret = await this.model.getById(msgId);
    return HttpUtil.success(res, { record: ret });
  }

  async removeInbox(req, res) {
    let params = HttpUtil.getRequiredParams2(req, ['chatId']);
    if (params.error) return HttpUtil.badRequest(res, params.error);
    let userId = req.authUser._id;
    let [err, channel] = await to(this.validateChannel(params.chatId, userId));
    if (err) return HttpUtil.badRequest(res, err.message || err);
    let conds = { channelId: channel.channelId, hideWithIds: { $ne: userId } };
    let updateInfo = {
      $push: { hideWithIds: userId },
      update: this.getCreateBy(),
    };
    await Promise.all([
      this.model.updateMany(conds, updateInfo),
      this.sChannel.removeUserChannel(userId, channel.channelId),
    ]);
    return HttpUtil.success(res);
  }

  async removeMessage(req, res) {
    let params = HttpUtil.getRequiredParams2(req, this.requireMsgID);
    if (params.error) return HttpUtil.badRequest(res, params.error);
    let authUser = req.authUser;
    let { msgId } = params;
    let record = await this.model.getById(msgId);
    if (!record) return HttpUtil.badRequest(res, `Message not found: ${msgId}`);

    let check = await this.checkMsgPermission(record, authUser);
    if (!check) {
      return HttpUtil.badRequest(
        res,
        `You are not allowed to delete this message: ${msgId}`,
      );
    }
    let hideWithIds = record.hideWithIds || [];
    if (hideWithIds.indexOf(authUser._id) == -1) {
      hideWithIds.push(authUser._id);
      await this.model.updateOne(msgId, { hideWithIds });
      let channel = await this.sChannel.getChannelById(record.channelId);
      Events.summaryMessageByChannel(channel);
      let ret = await this.model.getById(msgId);
      return HttpUtil.success(res, { record: ret });
    }
    return HttpUtil.unprocessable(res, `Nothing to update!`);
  }

  async checkMsgPermission(message, authUser) {
    let check = message.senderId == authUser._id;
    if (!check) {
      let channel = await this.sChannel.getChannelById(message.channelId);
      if (channel && channel.clientIds.indexOf(authUser._id) > -1) check = true;
    }
    return check;
  }

  async updateStatus(req, res) {
    let requireParams = [
      { name: 'msgIds', dataType: 'array', acceptEmpty: false },
      {
        name: 'status',
        dataType: 'number',
        acceptValues: [ConfigMsg.status.received, ConfigMsg.status.seen],
      },
    ];
    let params = HttpUtil.getRequiredParams2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);
    let { msgIds, status } = params;
    let idInvalids = msgIds.filter(id => !id);
    if (idInvalids.length) {
      return HttpUtil.badRequest(
        res,
        `Message ID invalid: array contains empty string`,
      );
    }
    let lists = await this.model.find({ _id: { $in: msgIds } });
    if (!lists || !lists.length) {
      return HttpUtil.badRequest(
        res,
        `Message not found: ${msgIds.join(', ')}`,
      );
    }
    if (lists.length != msgIds.length) {
      let existIds = lists.map(item => item._id);
      let idInvalids = msgIds.filter(id => existIds.indexOf(id) == -1);
      return HttpUtil.badRequest(
        res,
        `Message ID invalid: ${idInvalids.join(', ')}`,
      );
    }
    let authUser = req.authUser;
    let userId = authUser._id;
    let listsUpdate = [],
      channelIds = [];
    lists.map(item => {
      if (channelIds.indexOf(item.channelId) == -1)
        channelIds.push(item.channelId);
      if (item.senderId != userId) listsUpdate.push(item);
    });
    if (channelIds.length !== 1) {
      return HttpUtil.badRequest(
        res,
        `Messages that need to change state must be in a channel`,
      );
    }
    let rs = { modified: 0 };
    if (listsUpdate.length) {
      let channelId = channelIds[0];
      let [err, channel] = await to(this.validateChannel(channelId, userId));
      if (err) return HttpUtil.badRequest(res, err.message || err);
      let ids = listsUpdate.map(it => it._id);
      let updateInfo, conds;
      let logInfo = this.getCreateBy(authUser);
      if (status == ConfigMsg.status.seen) {
        conds = { _id: { $in: ids }, 'listUserSeen.by': { $ne: userId } };
        updateInfo = { $push: { listUserSeen: logInfo } };
      } else {
        conds = {
          _id: { $in: ids },
          'listUserSeen.by': { $ne: userId },
          'listUserReceived.by': { $ne: userId },
        };
        updateInfo = { $push: { listUserReceived: logInfo } };
      }
      listsUpdate = await this.model.find(conds);
      if (listsUpdate.length) {
        rs.modified = listsUpdate.length;
        ids = listsUpdate.map(it => it._id);
        let updateCond = { _id: { $in: ids } };
        await this.model.updateManyArray(updateCond, updateInfo);
        Events.summaryMessageByChannel(channel);
        let data = await this.model.find(updateCond);
        this.serviceSk.emitEventMessageUpdateStatus(data, channelId);
      }
    }
    return HttpUtil.success(res, rs);
  }

  async validateChannel(channelId, userId) {
    let record = await this.sChannel.getChannelById(channelId);
    if (!record) return this.throwErr(`Channel not found: ${channelId}`);
    if (record.clientIds && record.clientIds.indexOf(userId) == -1) {
      return this.throwErr(
        `You are not allowed to action with this channel: ${channelId}`,
      );
    }
    return record;
  }

  async validateSendMsg(receiverId, senderId) {
    if (String(receiverId) === String(senderId)) {
      this.throwErr('The receiver must be different from the sender');
    }
    let err, receiver, channel;
    [err, receiver] = await to(this.mCustomer.getById(receiverId));
    if (err) this.throwErr(err.message || err);
    if (!receiver) this.throwErr('Receiver not found: ' + receiverId);

    [err, channel] = await to(this.checkFriend(senderId, receiverId));
    if (err) this.throwErr(err.message || err);
    return channel;
  }

  async checkFriend(userId, friendId) {
    let channel = await this.sChannel.checkFriend(userId, friendId);
    if (!channel || !channel.isMatched) {
      this.throwErr(
        `ChatController.checkFriend ${JSON.stringify({
          userId,
          friendId,
        })}: not match friend!`,
      );
    }
    return channel;
  }
}

module.exports = new Controller();
