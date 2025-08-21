'use strict';
/**
 * @description Schema of User.
 */
const { roles } = require('../../config');
const currentTime = () => Math.floor(Date.now() / 1000) * 1000;

module.exports = {
  _id: String, // ULID
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    index: true,
  },
  role: {
    type: String,
    required: true,
    default: roles.operator,
    index: true,
  },
  address: {
    type: String,
    required: false,
    index: true,
  },
  phone: {
    type: String,
    index: true,
  },
  hash: {
    type: String,
    required: true,
  },
  salt: {
    type: String,
    required: true,
  },
  disable: {
    type: Boolean,
    default: false,
    index: true,
  },
  lastPasswordChange: {
    type: Number,
    default: currentTime(),
    index: true,
  },
  insert: {
    when: { type: Date, default: Date.now, index: true },
    by: { type: String, index: true, ref: 'User' },
  },
  update: {
    when: { type: Date, index: true },
    by: { type: String, index: true, ref: 'User' },
  },
  delete: {
    when: { type: Date, index: true },
    by: { type: String, index: true, ref: 'User' },
  },
};
