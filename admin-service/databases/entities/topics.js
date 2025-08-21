'use strict';
/**
 * @description Schema of Topic.
 */

module.exports = {
  _id: String, // ULID
  name: { type: String, require: true, unique: true, index: true },
  image: { type: String, require: true },
  description: { type: String, index: true },
  status: { type: Number, index: true, default: 0 }, // 0: pending, 1: processing, 2: stopped
  conditions: [], // điều kiện lọc nếu có -- Mục đích hẹn hò
  typeExplore: { type: Number, index: true, default: 0 }, // 1 verified, 0: Phần tử còn lại
  insert: {
    when: { type: Date, default: Date.now, index: true },
    by: { type: String, index: true, ref: 'User' },
  },
  update: {
    when: { type: Date, index: true },
    by: { type: String, index: true, ref: 'User' },
  },
};
