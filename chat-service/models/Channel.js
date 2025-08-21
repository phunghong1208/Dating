'use strict';
/**
 * @description Schema of Channel.
 */
const BaseModel = require('./Base');
const Entities = require('../databases/entities');
const Config = require('../config');
const Utils = require('../utils');

class Channel extends BaseModel {
  constructor() {
    super('Channel', Entities.channels);
  }

  async activateChannel(channel) {
    if (channel.status != Config.statusOfChannel.pending) return;
    return this.updateOne(channel._id, {
      status: Config.statusOfChannel.activated,
    });
  }

  async createChannelCouple(userId, friendId) {
    let clientIds = [userId, friendId];
    return this.insertOne({
      clientIds,
      channelId: Utils.generateULID(),
      type: Config.typeOfChannel.couple,
    });
  }

  async createChannelCoupleBot(userId, botId) {
    let clientIds = [userId, botId];
    return this.insertOne({
      clientIds,
      channelId: Utils.generateULID(),
      type: Config.typeOfChannel.couple,
      status: Config.statusOfChannel.activated,
    });
  }

  async getCoupleChannels(userId, friendId) {
    const conds = {
      $and: [
        { clientIds: userId },
        { clientIds: friendId },
        { type: Config.typeOfChannel.couple },
      ],
    };
    return this.find(conds);
  }

  async getByClientId(clientId) {
    return this.find({ clientIds: clientId });
  }

  async getIdsByClientId(clientId) {
    let lists = await this.getByClientId(clientId);
    let ids = [];
    if (lists && lists.length) ids = lists.map(it => it.channelId);
    return ids;
  }

  async getByChannelId(channelId) {
    return this.getOne({ channelId });
  }

  async getByChannelIds(channelIds) {
    return this.find({ channelId: { $in: channelIds } });
  }

  async getDupChannels() {
    let channels = await this.find();
    let mapChannels = {},
      data = [];
    channels.map(item => {
      let { clientIds, channelId } = item;
      let str = JSON.stringify(clientIds);
      if (!mapChannels[str]) {
        mapChannels[str] = channelId;
      } else {
        data.push(item);
      }
    });
    return { mapChannels, invalids: data };
  }

  async getPendingChannels() {
    return this.find({ status: Config.statusOfChannel.pending });
  }

  async activateChannels(channelIds) {
    return this.updateManyByCond(
      { channelId: { $in: channelIds } },
      { status: Config.statusOfChannel.activated },
    );
  }
}

module.exports = new Channel();
