'use strict';
/**
 * @description Schema of Customer.
 */
const {
  whoYouSeeTypes,
  whoSeeYouTypes,
  distanceUnits,
  autoPlayVideoOpts,
} = require('../../config/common');
const currentTime = () => Math.floor(Date.now() / 1000) * 1000;

module.exports = {
  _id: String, // ULID
  oAuth2Id: {
    // userId Firebase Authentication
    type: String,
    required: true,
    index: true,
  },
  fullname: {
    // Họ và tên
    type: String,
    required: true,
    index: true,
  },
  email: {
    // email
    type: String,
    index: true,
  },
  phone: {
    // Số điện thoại
    type: String,
    index: true,
  },
  dob: {
    // Ngày tháng năm sinh
    type: Date,
    required: true,
    index: true,
  },

  metadata: {
    age: { type: Number, index: true }, // Tuổi
  },

  // Verify tài khoản
  verifyStatus: { type: Boolean, default: false, index: true }, // Xác minh tài khoản
  // Location
  location: {
    lat: String,
    long: String,
  },
  // profiles
  profiles: {
    interests: [String], // Sở thích
    orientationSexuals: [String], // Khuynh hướng giới tính

    showCommon: {
      showSexual: { type: Boolean, default: false }, // Hiển thị khuynh hướng giới tính
      showGender: { type: Boolean, default: false }, // Hiển thị giới tính
      showAge: { type: Boolean, default: false }, // Hiển thị tuổi
      showHeight: { type: Boolean, default: false }, // Hiển thị chiều cao
      showEthnicity: { type: Boolean, default: false }, // Hiển thị dân tộc
      showChildrenPlan: { type: Boolean, default: false }, // Hiển thị kế hoạch trẻ em
      showFamilyPlan: { type: Boolean, default: false }, // Hiển thị kế hoạch gia đình
      showWork: { type: Boolean, default: false }, // Hiển thị công việc làm ở đâu
      showSchool: { type: Boolean, default: false }, // Hiển thị trường bạn
      showEducation: { type: Boolean, default: false }, // Hiển thị giáo dục
      showDrinking: { type: Boolean, default: false }, // Hiển thị bạn có uống rượu không
      showSmoking: { type: Boolean, default: false }, // Hiển thị bạn có hút thuốc không
      showDrug: { type: Boolean, default: false }, // Hiển thị ma túy
      showDistance: { type: Boolean, default: false }, // Hiển thị khoảng cách,
    },

    about: String, // Mô tả bản thân
    gender: { type: String, required: true, index: true }, // Giới tính
    height: { type: Number }, // Hiển thị chiều cao,
    school: { type: String, index: true }, // Trường học
    company: { type: String, index: true }, // Công ty
    jobTitle: { type: String, index: true }, // Chức danh công việc
    address: { type: String, required: false, index: true }, // Địa chỉ hiện tại
    datingPurpose: { type: String, index: true }, // Mục đích hẹn hò
    languages: [String], // Ngôn ngữ tôi biết

    childrenPlan: { type: String, index: true }, // Kế hoạch trẻ em
    // Basic information
    zodiac: { type: String, index: true }, // Cung hoàng đạo
    education: { type: String, index: true }, // Giáo dục
    familyPlan: { type: String, index: true }, // Gia đình tương lai
    covidVaccine: { type: String, index: true }, // Vắc xin COVID
    personality: { type: String, index: true }, // Kiểu tính cách
    communicationType: { type: String, index: true }, // Phong cách giao tiếp
    loveStyle: { type: String, index: true }, // Ngôn ngữ tình yêu
    // Life style
    pet: { type: String, index: true }, // Vật nuôi
    drinking: { type: String, index: true }, // Sở thích nhậu
    smoking: { type: String, index: true }, // Hút thuốc
    workout: { type: String, index: true }, // Tập luyện thể thao
    dietaryPreference: { type: String, index: true }, // Sở thích ăn uống
    socialMedia: { type: String, index: true }, // Truyền thông xã hội
    sleepingHabit: { type: String, index: true }, // Thói quen ngủ
    // Thông tin bổ sung
    ethnicitys: [String], // Hiển thị dân tộc
    smartPhoto: { type: Boolean, default: false }, // Ảnh thông minh
    drug: { type: String, index: true }, // Hiển thị có dùng ma túy không
    // Thông tin chưa làm
    favoriteSongs: [String], // Bài hát yêu thích
  },
  // setting configs
  settings: {
    global: {
      isEnabled: { type: Boolean, default: false }, // Hiển thị toàn cầu
      languages: [String],
    },
    // Khoảng cách ưu tiên
    distancePreference: {
      range: { type: Number, default: 10 },
      unit: { type: String, default: distanceUnits.km }, // Đơn vị km/miles
      onlyShowInThis: { type: Boolean, default: false }, // Chỉ hiện người trong phạm vi này
    },
    // Độ tuổi ưu tiên
    agePreference: {
      min: { type: Number, default: 15 },
      max: { type: Number, default: 30 },
      onlyShowInThis: { type: Boolean, default: false }, // Chỉ hiện người trong phạm vi này
    },
    genderFilter: { type: String, default: 'all' }, // hiển thị cho tôi giới tính? "men","women","all"
    autoPlayVideo: { type: String, default: autoPlayVideoOpts.always }, // Tự động phát video no/wifi/always
    showTopPick: { type: Boolean, default: true }, // Hiển thi tôi trong danh sách top lựa chọn hằng ngày
    showOnlineStatus: { type: Boolean, default: true }, // Hiển thị trạng thái online trong khoảng time (2h tính từ lần online cuối)
    showActiveStatus: { type: Boolean, default: true }, // Hiển thị trạng thái hoạt động trong 24h
    // Thông báo gửi về email
    notiSeenEmail: {
      newMatchs: { type: Boolean, default: false }, // Thông báo có người match mới
      incomingMessage: { type: Boolean, default: false }, // Thông báo có tin nhắn
      promotions: { type: Boolean, default: false }, // Thông báo thông tin về app
    },
    // Thông báo gửi về App
    notiSeenApp: {
      newMatchs: { type: Boolean, default: false }, // Thông báo có người match mới
      incomingMessage: { type: Boolean, default: false }, // Thông báo có tin nhắn
      promotions: { type: Boolean, default: false }, // Thông báo thông tin về app
      superLike: { type: Boolean, default: false }, // Thông báo có người super like
    },
    /*
      incognitoMode: true -> ẩn danh chỉ những người like or matched mới nhìn thấy, ng khác không thể tìm kiếm thấy bạn
      incognitoMode: false -> standard hiển thị trong danh sách quẹt, có thể tìm kiếm bạn
    */
    //
    incognitoMode: { type: Boolean, default: false }, // Ẩn danh
  },
  // Control who
  plusCtrl: {
    whoYouSee: { type: String, default: whoYouSeeTypes.default }, // config whoYouSeeTypes
    whoSeeYou: { type: String, default: whoSeeYouTypes.everyone }, // config whoSeeYouTypes
  },

  languageMachine: { type: String, index: true },

  // Explore
  explore: {
    verified: { type: Number, default: 0, index: true }, // Xác minh người thật bằng camera, face ID
    topics: [String], // Lưu thông tin các topics đã join
  },

  onlineNow: { type: Boolean, default: true, index: true }, // Trạng thái online
  activeStatus: { type: Boolean, default: true, index: true }, // Trạng thái hoạt động
  lastActiveTime: { type: Date, index: true }, // Thời gian hoạt động gần đây nhất
  // vô hiệu hóa
  disable: {
    type: Boolean,
    default: false,
    index: true,
  },
  // Package
  packages: {
    packageId: { type: String, ref: 'Package' }, // Gói mua
    pkgRegistrationDate: { type: Date, index: true }, // Ngày đăng ký gói
    pkgExpirationDate: { type: Date, index: true }, // Ngày hết hạn sử dụng gói
  },

  coins: { type: Number, default: 0 }, // Tiền xu thanh toán trong app
  numberLike: { type: Number, default: 0 }, // Số lượt like
  numberSuperLike: { type: Number, default: 0 }, // Số lượt siêu thích
  numberBooster: { type: Number, default: 0 }, // Số lượt tăng tốc
  boostInfo: {
    duration: Number,
    startTime: { type: Date, index: 1 },
    endTime: { type: Date, index: 1 },
  },

  lastPasswordChange: {
    type: Number,
    default: currentTime(),
    index: true,
  },
  // Date add
  insert: {
    when: { type: Date, default: Date.now, index: true },
  },
  // Date update
  update: {
    when: { type: Date, index: true },
    by: { type: String, index: true },
  },
  // Block
  block: {
    when: { type: Date, index: true },
    by: { type: String, index: true },
  },
  // unlock
  unlock: {
    when: { type: Date, index: true },
    by: { type: String, index: true },
  },
  // Date delete
  delete: {
    when: { type: Date, index: true },
    by: { type: String, index: true },
  },
};
