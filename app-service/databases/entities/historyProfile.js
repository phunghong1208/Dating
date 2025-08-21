'use strict';
/**
 * @description Schema of HistoryProfile.
 */

module.exports = {
  _id: String, // ULID
  typeHistory: { type: Number, index: true },
  metaData: {},
  userId: { type: String, ref: 'Customer', index: true },
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
