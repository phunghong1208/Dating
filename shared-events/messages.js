const BaseEvent = require('./base');
const Message = require('../shared-models/Message');
const UserChannel = require('../shared-models/UserChannel');
const Utils = require('../utils');

class EventMessage extends BaseEvent {
  constructor() {
    super(EventMessage);
    this.mMessage = Message;
    this.mUserChannel = UserChannel;
  }

  async summaryMessageByChannel(channel) {
    let channelId = channel.channelId;
    if (channel && channel.clientIds && channel.clientIds.length) {
      let promises = [];
      channel.clientIds.map(userId => {
        promises.push(this.updateSummaryUserChannel(userId, channelId));
      });
      await Promise.all(promises);
    }
    return true;
  }

  async updateSummaryUserChannel(userId, channelId) {
    let promises = [
      this.mMessage.getCount({ channelId }),
      this.mMessage.getCount({
        channelId,
        $or: [{ 'listUserReceived.by': userId }, { 'listUserSeen.by': userId }],
      }),
      this.mMessage.getCount({ channelId, 'listUserSeen.by': userId }),
      this.mMessage.getLastMessageForChannel([channelId]),
    ];
    let rs = await Promise.all(promises);
    if (rs) {
      let [total, numReceived, numSeen, channels] = rs;
      let numNotReceived = total - numReceived;
      let numUnRead = total - numSeen;
      let summary = { total, numNotReceived, numUnRead };
      let lastActiveTime;
      if (channels && channels[0])
        lastActiveTime = channels[0].lastMessage.insert.when;
      let data = {
        userId,
        channelId,
        summary,
        lastActiveTime,
        update: Utils.getCreateBy(),
      };
      return await this.mUserChannel.updateItem({ userId, channelId }, data, {
        upsert: true,
      });
    }
    return true;
  }
}

module.exports = EventMessage;
