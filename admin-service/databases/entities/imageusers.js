'use strict';
/**
 * @description Schema of Image.
 */

module.exports = {
  _id: String, // ULID
  // id: { type: String }, // ulid
  avatars: [
    
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
