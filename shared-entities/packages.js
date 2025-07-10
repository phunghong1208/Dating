'use strict';
/**
 * @description Schema of Package.
 */

module.exports = {
  _id: String, // ULID
  name: { type: String, require: true, unique: true, index: true }, // Tên package
  type: { type: String, require: true, index: true },
  description: { type: String, index: true },
  options: {
    // Nâng câp lượt thích của bạn
    priorityTop: { type: Boolean, default: false }, // Top tuyển chọn: View list hồ sơ được tuyển chọn hàng ngày
    unlimitedLikes: { type: Boolean, default: false }, // Thích không giới hạn
    ctrlWhoLikeYou: { type: Boolean, default: false }, // Xem ai thích bạn
    priorityLike: { type: Boolean, default: false }, // Lượt thích ưu tiên: là hồ sơ đầu tiên được thấy bởi những người bạn thích
    // Nâng cao trải nghiệm của bạn
    unlimitedReturns: { type: Boolean, default: false }, // Quay lại không giới hạn
    freeBoosterPerMonth: { type: Boolean, default: false }, // 1 lượt tăng tốc miễn phí mỗi tháng
    superLikesPerWeek: { type: Boolean, default: false }, // 5 lượt siêu thích miễn phí mỗi tuần
    chatBeforeMatching: { type: Boolean, default: false }, // Nhắn tin trước khi tương hợp
    // Khám phá cao cấp
    passportAnyWhere: { type: Boolean, default: false }, // Hộ chiếu: Tương hợp với các thành viên ở bất kỳ nơi đâu
    // Kiểm soát
    turnOffAds: { type: Boolean, default: false }, // Ẩn quảng cáo
    ctrlProfile: { type: Boolean, default: false }, // Kiểm soát hồ sơ của bạn
    ctrlWhoSeeYou: { type: Boolean, default: false }, // Kiểm soát việc ai nhìn thấy bạn
    ctrlWhoYouSee: { type: Boolean, default: false }, // Kiểm soát việc bạn nhìn thấy ai
  },
  usagePeriod: { type: String, default: '30D' }, // Thời gian sử dụng 30D -> 30 ngày, 1M -> 1 tháng
  insert: {
    when: { type: Date, default: Date.now, index: true },
    by: { type: String, index: true, ref: 'User' },
  },
  update: {
    when: { type: Date, index: true },
    by: { type: String, index: true, ref: 'User' },
  },
  delete: {
    when: { type: Date, index: true },
    by: { type: String, index: true, ref: 'User' },
  },
};
