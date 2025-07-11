'use strict';
/**
 * @description Schema of Payment.
 */

module.exports = {
  _id: String, // ULID
  customer: {
    type: String,
    require: true,
    index: true,
    ref: 'Customer',
  },
  category: { type: String, index: true }, // phân loại: coins, packages, ...
  amount: { type: Number, default: 0 },
  unit: { type: String, index: true, default: 'VND' },
  descriptions: {
    quantity: Number, // Số lượng
    about: String, // Mô tả
  },
  insert: {
    when: { type: Date, default: Date.now, index: true },
  },
  delete: {
    when: { type: Date },
    by: { type: String, index: true, ref: 'User' },
  },
};
