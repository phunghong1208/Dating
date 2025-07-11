'use strict';
/**
 * @description Schema of ImageClone.
 */

module.exports = {
  _id: String, // ULID
  // id: { type: String }, // ulid
  avatars: [
    // {
    //   id: String,
    //   meta: {},
    //   reviewerStatus: { type: Number, index: true }, // 0: pending / 1: accepted / 2: rejected
    //   order: { type: Number }, // Thứ tự
    //   comment: String, // Bình luật về bức ảnh
    //   reviewerViolateOption: [String], // Người đánh giá chọn vi phạm của bức ảnh
    //   aiStatus: { type: Number, index: true }, // 0: pending / 1: accepted / 2: rejected
    //   aiViolateOption: [String], // AI đánh giá chọn vi phạm của bức ảnh
    //   aiPoint: { type: Number }, // Điểm của bức ảnh
    // },
  ],
  // verified: {
  //   when: { type: Date, index: true },
  //   by: { type: String, index: true },
  // },
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
