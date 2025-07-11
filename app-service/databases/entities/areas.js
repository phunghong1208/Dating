'use strict';
/**
 * @description Schema of Area.
 */
//Bảng lưu thông tin về các khu vực/địa phương trong hệ thống.
module.exports = {
  _id: String, // ULID
  name: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  lng: { type: String },
  lat: { type: String },

  insert: {
    when: { type: Date, default: Date.now },
    by: { type: String, index: true, ref: 'User' },
  },
  update: {
    when: { type: Date },
    by: { type: String, index: true, ref: 'User' },
  },
  delete: {
    when: { type: Date, index: true },
    by: { type: String, index: true, ref: 'User' },
  },
};
