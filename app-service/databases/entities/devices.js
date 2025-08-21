'use strict';
/**
 * @description Schema of Device.
 */

module.exports = {
  _id: String, // ULID
  fcmToken: {
    type: String,
    require: true,
    index: true,
    unique: true,
  },
  userId: {
    type: String,
    require: true,
    index: true,
  },
  deviceInfo: {},
  insert: {
    when: { type: Date, default: Date.now, index: true },
  },
  update: {
    when: { type: Date, index: true },
  },
};
