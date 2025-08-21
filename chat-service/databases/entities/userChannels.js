'use strict';
/**
 * @description Schema of UserChannel.
 */

module.exports = {
  _id: String, // ULID
  userId: {
    type: String,
    require: true,
    index: true,
    ref: 'Customer',
  },
  channelId: {
    type: String,
    require: true,
    index: true,
  },
  summary: {
    total: { type: Number, index: true, default: 0 },
    numUnRead: { type: Number, index: true, default: 0 },
    numNotReceived: { type: Number, index: true, default: 0 },
  },
  lastActiveTime: { type: Date, index: true }, // Thời gian hoạt động gần đây nhất
  // times
  insert: {
    when: { type: Date, default: Date.now, index: true },
  },
  update: {
    when: { type: Date, index: true },
  },
};
