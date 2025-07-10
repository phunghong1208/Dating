'use strict';
/**
 * @description Schema of Socket.
 */

module.exports = {
  _id: String, // ULID
  sid: {
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
  source: {
    type: String,
    require: true,
    default: 'Customer', // Customer or User,
    index: true,
  },
  host: {
    type: String,
    require: true,
    index: true,
  },
  deviceInfo: {},
  ipInfo: {},
  packageInfo: {},
  insert: {
    when: { type: Date, default: Date.now, index: true },
  },
  update: {
    when: { type: Date, index: true },
  },
};
