'use strict';
/**
 * @description Schema of Reason.
 */

module.exports = {
  _id: String, // ULID
  reason: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  details: [
    {
      type: String,
      index: true,
    },
  ],
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
