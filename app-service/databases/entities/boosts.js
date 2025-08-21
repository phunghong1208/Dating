'use strict';
/**
 * @description Schema of Boost.
 */

module.exports = {
  _id: String, // ULID
  customer: {
    type: String,
    require: true,
    index: true,
    ref: 'Customer',
  },
  startTime: { type: Date, index: true },
  endTime: { type: Date, index: true },
  duration: Number,
  insert: {
    when: { type: Date, default: Date.now, index: true },
  },
};
