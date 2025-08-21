'use strict';
/**
 * @description Schema of Report.
 */

module.exports = {
  _id: String, // ULID

  agentReportId: {
    type: String,
    require: true,
    index: true,
  }, // Tác nhân

  reportedSubjectId: {
    type: String,
    require: true,
    index: true,
  }, // Đối tượng bị report

  reasonCode: {
    type: String,
    require: true,
    index: true,
  }, 
  codeTitle: {
    type: String,
    require: true,
    index: true,
  },
  codeDetail: {
    type: String,
    require: true,
    index: true,
  },
  comments: {
    type: String,
    index: true,
  }, // Nội dung chi tiết báo cáo

  imageReports: [], // Hình ảnh bị báo cáo
  // times
  insert: {
    when: { type: Date, default: Date.now, index: true },
  },
};
