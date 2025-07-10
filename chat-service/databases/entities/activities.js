'use strict';
/**
 * @description Schema of Activity.
 */
//Bảng lưu lịch sử các hoạt động/tương tác giữa các user trong hệ thống.

module.exports = {
  _id: String, // ULID
  agentId: {
    type: String,
    require: true,
    index: true,
  }, // tác nhân
  promptImageId: {
    type: String,
    require: true,
    index: true,
  },
  typeOrder: {
    type: Number,
    default: 0, // 0: image, 1: prompt, 2: user
    index: true,
  },
  interactorId: {
    type: String,
    require: true,
    index: true,
  }, // đối tượng tương tác
  actionType: {
    type: Number,
    default: 0, // 0: nope, 1: like, 2: superlike
    index: true,
  },
  // times
  insert: {
    when: { type: Date, default: Date.now, index: true },
  },
  update: {
    when: { type: Date, default: Date.now, index: true },
  },
  delete: {
    when: { type: Date, index: true },
    by: { type: String, index: true },
  },
};
