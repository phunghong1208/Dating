'use strict';

const { lang } = require('moment');

/**
 * @description Schema of Reason.
 */

module.exports = {
  _id: String, // ULID
  code: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  langs: {
    en: String,
    vi: String,
    ja: String,
  },
  codeReason: [],
  // times
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
