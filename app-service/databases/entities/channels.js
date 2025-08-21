'use strict';
/**
 * @description Schema of Channel.
 */
const Config = require('../../config');

module.exports = {
  _id: String, // ULID
  channelId: {
    type: String,
    require: true,
    index: true,
    unique: true,
  },
  clientIds: {
    type: Array,
    index: true,
    default: [],
  }, // array customers._id
  type: {
    type: Number,
    index: true,
    default: Config.typeOfChannel.couple, // 1: couple, 2: group
  },
  status: {
    type: Number,
    index: true,
    default: Config.statusOfChannel.pending, // 0: pending, 1: activated contact sent message
  },
  isMatched: {
    // using for type == couple
    type: Boolean,
    index: true,
    default: true,
  },
  // times
  insert: {
    when: { type: Date, default: Date.now, index: true },
  },
  update: {
    when: { type: Date, index: true },
  },
  delete: {
    when: { type: Date, index: true },
    by: { type: String, index: true },
  },
};
