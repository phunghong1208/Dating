'use strict';
/**
 * @description Schema of Report.
 */

module.exports = {
  _id: String, // ULID
  reportId: {
    type: String,
    require: true,
    index: true,
  }, // tác nhân
  userId: {
    type: String,
    require: true,
    index: true,
  }, // đối tượng bị report
  reasonId: {
    type: String,
    require: true,
    index: true,
  },
  reasonDetail: {
    type: String,
    index: true,
  },
  comments: {
    type: String,
    index: true,
  },
  // times
  insert: {
    when: { type: Date, default: Date.now, index: true },
  },
};
