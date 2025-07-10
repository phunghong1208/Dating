'use strict';

const to = require('await-to-js').default;
const BaseController = require('../../../Base');
const HttpUtil = require('../../../utils/http');
const Message = require('../../models/Message');
const ServiceChannel = require('../../services/channels');
const ServiceSocket = require('../../services/socket');
const ServiceActivity = require('../../services/activities');
const ServiceReport = require('../../services/reports');
const ServiceBoost = require('../../services/boost');
const Events = require('../../databases/events');

class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.model = Message;
    this.sChannel = ServiceChannel;
    this.serviceSk = ServiceSocket;
    this.sActivity = ServiceActivity;
    this.sReport = ServiceReport;
    this.sBoost = ServiceBoost;
  }

  async iterateSummaryUserChannel(req, res) {
    let pipeline = [
      { $group: { _id: '$channelId', items: { $push: '$$ROOT' } } },
    ];
    let lists = await this.model.execAggregate(pipeline);
    let promises = lists.map(item => this.summaryMessageByChannelId(item._id));
    let rs = await Promise.all(promises);
    return HttpUtil.success(res, rs);
  }

  async summaryMessageByChannelId(channelId) {
    let channel = await this.sChannel.getChannelById(channelId);
    return Events.summaryMessageByChannel(channel);
  }

  async checkDupChannels(req, res) {
    let rs = await this.sChannel.checkDupChannels();
    return HttpUtil.success(res, rs);
  }

  async getDetailChannel(req, res) {
    let { chatId } = req.params;
    let channel = await this.sChannel.getChannelById(chatId);
    let rs = await this.serviceSk.getSocketsNativeByChannel(chatId);
    return HttpUtil.success(res, { channel, ...rs });
  }

  async cleanSessionSockets(req, res) {
    let [err, rs] = await to(this.serviceSk.cleanSessionDisconnectedSockets());
    if (err) return HttpUtil.internalServerError(res, err);
    return HttpUtil.success(res, rs);
  }

  async checkActivities(req, res) {
    let [err, data] = await to(this.sActivity.checkRecords());
    if (err) return HttpUtil.internalServerError(res, err);
    return HttpUtil.success(res, data);
  }

  async checkDataReports(req, res) {
    let [err, data] = await to(this.sReport.checkRecords());
    if (err) return HttpUtil.internalServerError(res, err);
    return HttpUtil.success(res, data);
  }

  async checkDataBoost(req, res) {
    let [err, data] = await to(this.sBoost.checkRecords());
    if (err) return HttpUtil.internalServerError(res, err);
    return HttpUtil.success(res, data);
  }

  async iterateActivatedChannel(req, res) {
    let channels = await this.sChannel.getPendingChannels();
    if (!channels || !channels.length)
      return HttpUtil.unprocessable(res, 'Not found pending channels');

    let promises = channels.map(item =>
      this.sChannel.checkChannelActivated(item),
    );
    let ret = await Promise.all(promises);
    if (!ret || !ret.length)
      return HttpUtil.unprocessable(res, 'checkChannelActivated error!');

    let channelIds = ret.filter(it => !it.activated).map(it => it.channelId);
    if (!channelIds.length) return HttpUtil.success(res, { modified: 0 });

    let [err, rs] = await to(this.sChannel.activateChannels(channelIds));
    if (err) return HttpUtil.internalServerError(res, err);
    return HttpUtil.success(res, { modified: channelIds.length });
  }
}

module.exports = new Controller();
