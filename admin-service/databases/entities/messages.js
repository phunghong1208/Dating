'use strict';
/**
 * @description Schema of Message.
 */

module.exports = {
  _id: String, // ULID
  channelId: {
    type: String,
    require: true,
    index: true,
  },
  senderId: {
    type: String,
    require: true,
    index: true,
    ref: 'Customer',
  },
  message: {
    text: { type: String, index: true },
    image: String,
    icons: [],
    reacts: [],
  },
  /*
    child: {by: customer._id, when: Date.now}
  */
  listUserReceived: {
    type: Array,
    index: true,
    default: [],
  },
  listUserSeen: {
    type: Array,
    index: true,
    default: [],
  },
  hideWithIds: {
    type: Array,
    index: true,
    default: [],
  }, // [senderId, receiverId]
  insert: {
    when: { type: Date, default: Date.now, index: true },
  },
  update: {
    when: { type: Date, index: true },
  },
  delete: {
    when: { type: Date, index: true },
  },
};
