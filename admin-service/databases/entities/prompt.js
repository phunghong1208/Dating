'use strict';
/**
 * @description Schema of Image.
 */

module.exports = {
  _id: String, // ULID
  code: {
    type: String,
  },
  codeCategory: String,
  langs: {
    en: String,
    vi: String,
    ja: String,
  },
  insert: {
    when: { type: Date, default: Date.now, index: true },
  },
  update: {
    when: { type: Date, index: true },
    by: { type: String, index: true },
  },
  delete: {
    when: { type: Date, index: true },
    by: { type: String, index: true },
  },
};
