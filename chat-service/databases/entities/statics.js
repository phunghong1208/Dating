'use strict';
/**
 * @description Schema of Static.
 */

module.exports = {
  _id: String, // ULID
  code: {
    type: String,
    // unique: true, // chuyển unique code + category
    required: true,
    index: true,
  },
  langs: {
    en: String,
    vi: String,
    ja: String,
  },
  category: {
    type: String,
    required: true,
    index: true,
  },
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
