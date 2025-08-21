'use strict';
/**
 * @description Schema of Job.
 */

module.exports = {
  _id: String, // ULID
  name: { type: String, index: true },
  timeStart: { type: Date, index: true },
  timeEnd: { type: Date, index: true },
  message: String,
  isSuccess: {
    type: Boolean,
    index: true,
    default: true,
  },
  insert: {
    when: { type: Date, default: Date.now, index: true },
    by: { type: String, index: true, ref: 'User' },
  },
};
