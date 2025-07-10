'use strict';
/**
 * @description Schema of Message.
 */
const BaseModel = require('../models/Base');
const Entities = require('../databases/entities');

class Message extends BaseModel {
  constructor() {
    super('Message', Entities.messages);
    this.allowFields = [
      '_id',
      'channelId',
      'senderId',
      'message',
      'listUserReceived',
      'listUserSeen',
      'hideWithIds',
      'insert',
      'update',
    ];
  }

  async getLastMessageForChannel(channelIds) {
    let pipeline = [
      {
        $match: { channelId: { $in: channelIds }, delete: { $exists: false } },
      },
      { $sort: { 'insert.when': -1 } },
      { $group: { _id: '$channelId', lastMessage: { $first: '$$ROOT' } } },
      {
        $project: {
          channelId: '$_id',
          'lastMessage._id': 1,
          'lastMessage.message': 1,
          'lastMessage.insert': 1,
          'lastMessage.senderId': 1,
          'lastMessage.channelId': 1,
          'lastMessage.listUserReceived': 1,
          'lastMessage.listUserSeen': 1,
          'lastMessage.hideWithIds': 1,
        },
      },
    ];
    return this.execAggregate(pipeline);
  }

  async mapLastMessageByChannelId(channelIds) {
    let mapObjects = {};
    let rs = await this.getLastMessageForChannel(channelIds);
    if (rs && rs.length) {
      rs.map(item => {
        mapObjects[item.channelId] = item.lastMessage;
      });
    }
    return mapObjects;
  }

  async getMessagesForChannel(channelId, userId, options) {
    const conds = { channelId, hideWithIds: { $ne: userId } };
    let promises = [this.getMessages(conds, options)];
    if (options.pageSize > 0) {
      promises.push(this.countMessages(conds));
    }
    let rs = await Promise.all(promises);
    return { lists: rs[0], total: rs[1] || 0 };
  }

  async getMessages(conds, opts) {
    return this.find(conds, opts || {});
  }

  async countMessages(conds) {
    return this.getCount(conds);
  }

  async getByChannelId(channelId) {
    return this.getMessages({ channelId });
  }
}

module.exports = new Message();
