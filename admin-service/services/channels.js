'use strict';

const to = require('await-to-js').default;
const BaseService = require('./Base');
const Utils = require('../utils');
const DBUtils = require('../utils/Database');
const Customer = require('../models/Customer');
const Channel = require('../models/Channel');
const Message = require('../models/Message');
const UserChannel = require('../models/UserChannel');
const Image = require('../models/Image');
const PromptAnswer = require('../models/PromptAnswer');

class Service extends BaseService {
  constructor() {
    super(Service);
    this.model = Channel;
    this.mCustomer = Customer;
    this.mMessage = Message;
    this.mUserChannel = UserChannel;
    this.mImage = Image;
    this.modelPrompt = PromptAnswer;
  }

  async getChannelById(channelId) {
    return this.model.getByChannelId(channelId);
  }

  async getCoupleChannel(userId, friendId) {
    let lists = await this.model.getCoupleChannels(userId, friendId);
    if (lists && lists.length) return lists[0];
    return await this.model.createChannelCouple(userId, friendId);
  }

  async getCoupleChannelId(userId, friendId) {
    let channel = await this.getCoupleChannel(userId, friendId);
    if (channel) return channel.channelId;
    return null;
  }

  async makeFriend(userId, friendId, isMatched = false) {
    let channel = await this.checkFriend(userId, friendId);
    if (isMatched) {
      if (!channel || !channel.isMatched) {
        await this.addFriend(userId, friendId, channel);
      }
    } else {
      if (channel && channel.isMatched) {
        await this.removeFriend(channel);
      }
    }
    return true;
  }

  async checkExitsChannelId(userId, botId) {
    let channel = await this.checkFriend(userId, botId);
    return channel;
  }

  async matchFriendBot(userId, botId, isMatched = false) {
    let channel = await this.checkFriend(userId, botId);

    if (isMatched) {
      if (!channel || !channel.isMatched) {
        console.log('Vao');

        await this.addMatchFriendBot(userId, botId);
      }
    }
    return channel;
  }

  async addMatchFriendBot(userId, botId) {
    return await this.model.createChannelCoupleBot(userId, botId);
  }

  async addFriend(userId, friendId, channel) {
    if (channel) {
      return await this.model.updateOne(channel._id, { isMatched: true });
    } else {
      return await this.model.createChannelCouple(userId, friendId);
    }
  }

  async checkFriend(userId, friendId) {
    let [err, rs] = await to(this.model.getCoupleChannels(userId, friendId));
    if (err) {
      console.log(`ActionController.checkFriend error:`, err.message);
    }
    let channel = null;
    if (rs && rs[0]) channel = rs[0];
    return channel;
  }

  async removeFriend(channel) {
    let [err, rs] = await to(
      this.model.updateOne(channel._id, { isMatched: false }),
    );
    if (err) {
      console.log(
        `ActionController.removeFriend --> update channel._id ${channel._id} error:`,
        err.message,
      );
    }
    return rs;
  }

  async removeUserChannel(userId, channelId) {
    return this.mUserChannel.deleteOne({ userId, channelId });
  }

  async getActiveChannels(authUser, options) {
    let { lists, total } = await this.mUserChannel.getByUserId(
      authUser._id,
      options,
    );

    let data = [];
    if (lists && lists.length) {
      let channelIds = lists.map(it => it.channelId);
      let mapLastMessages = await this.mMessage.mapLastMessageByChannelId(
        channelIds,
      );

      let mapChannels = await this._buildMapChannels(channelIds);
      data = lists.map(item => {
        let { summary, channelId } = item;
        let channel = mapChannels[channelId] || {};
        let clients = channel.clients || [];
        let lastMessage = mapLastMessages[channelId] || null;
        // clients = clients.filter(it => it._id != authUser._id);
        return { channelId, clients, summary, lastMessage };
      });
    }
    return DBUtils.paginationResult(data, total, options);
  }

  async _buildMapChannels(channelIds) {
    let lists = await this.model.getByChannelIds(channelIds);
    let map = {};
    if (lists && lists.length) {
      let clientIds = [];
      lists.map(it => {
        it.clientIds.map(id => {
          if (clientIds.indexOf(id) == -1) clientIds.push(id);
        });
      });
      let mapClients = await this.mCustomer.buildMapForChannel(clientIds);
      mapClients = await Promise.all(
        mapClients.map(async element => {
          const clonedItem = Utils.cloneObject(element);
          let { ...obj } = clonedItem;
          const pipeline = [
            {
              $match: {
                userId: obj._id,
                'avatars.reviewerStatus': {
                  $exists: true,
                  $in: [0, 1, 2],
                },
              }, // Điều kiện userId
            },

            {
              $unwind: '$avatars',
            },
            {
              $match: {
                'avatars.reviewerStatus': {
                  $exists: true,
                  $in: [1],
                },
              },
            },
            {
              $group: {
                _id: '$_id',
                avatars: { $push: '$avatars' }, // Gom các avatar vào một mảng mới
              },
            },
          ];
          let resultImage = await this.mImage.execAggregate(pipeline);
          const resultPrompt = await this.modelPrompt.getByIdsUserId(obj._id);

          if (resultImage.length !== 0) {
            obj.profiles.avatars = [...resultImage[0].avatars];
          } else {
            obj.profiles.avatars = [];
          }

          if (resultPrompt) {
            obj.profiles.prompts = [...resultPrompt.promptAnswers];
          }

          return obj;
        }),
      );

      let mapNew = {};
      if (mapClients && mapClients.length) {
        mapClients.map(item => {
          mapNew[item._id] = item;
        });
      }

      lists.map(it => {
        it.clients = [];
        it.clientIds.map(async id => {
          if (mapNew[id]) it.clients.push(mapNew[id]); // fixed for client deleted
        });
        map[it.channelId] = it;
      });
    }
    return map;
  }

  async getMessagesForChannel(channelId, userId, options) {
    let channel = await this.getChannelById(channelId);
    if (!channel) return this.throwErr(`Channel not found: ${channelId}`);
    if (channel.clientIds.indexOf(userId) == -1) {
      return this.throwErr(
        `You are not allowed to get messages of channelId: ${channelId}`,
      );
    }
    let clients = await this.mCustomer.getClients(channel.clientIds);
    clients = await Promise.all(
      clients.map(async element => {
        const clonedItem = Utils.cloneObject(element);
        let { ...obj } = clonedItem;
        const pipeline = [
          {
            $match: {
              userId: obj._id,
              'avatars.reviewerStatus': {
                $exists: true,
                $in: [0, 1, 2],
              },
            }, // Điều kiện userId
          },

          {
            $unwind: '$avatars',
          },
          {
            $match: {
              'avatars.reviewerStatus': {
                $exists: true,
                $in: [1],
              },
            },
          },
          {
            $group: {
              _id: '$_id',
              avatars: { $push: '$avatars' }, // Gom các avatar vào một mảng mới
            },
          },
        ];
        let resultImage = await this.mImage.execAggregate(pipeline);
        const resultPrompt = await this.modelPrompt.getByIdsUserId(obj._id);

        if (resultImage.length !== 0) {
          obj.profiles.avatars = [...resultImage[0].avatars];
        } else {
          obj.profiles.avatars = [];
        }

        if (resultPrompt) {
          obj.profiles.prompts = [...resultPrompt.promptAnswers];
        }

        return obj;
      }),
    );

    let { lists, total } = await this.mMessage.getMessagesForChannel(
      channelId,
      userId,
      options,
    );
    return {
      channelId,
      ...DBUtils.paginationResult(lists, total, options),
      clients,
    };
  }

  async checkDupChannels() {
    return this.model.getDupChannels();
  }

  async getPendingChannels() {
    return this.model.getPendingChannels();
  }

  async checkChannelActivated(channel) {
    let { channelId } = channel;
    let activated = false;
    let messages = await this.mMessage.getByChannelId(channelId);
    if (messages && messages.length) activated = true;
    return { channelId, activated };
  }

  async activateChannels(channelIds) {
    return this.model.activateChannels(channelIds);
  }
}

module.exports = new Service();
