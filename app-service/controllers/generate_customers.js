const fs = require('fs');

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pad(num, size) {
  let s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}

const names = [
    "Diệu Anh", "Quỳnh Anh", "Trâm Anh", "Nguyệt Cát", "Trân Châu", "Quế Chi", "Trúc Chi", "Xuyến Chi",
    "Thiên Di", "Ngọc Diệp", "Nghi Dung", "Linh Đan", "Thục Đoan", "Thu Giang", "Thiên Hà", "Hiếu Hạnh",
    "Thái Hòa", "Dạ Hương", "Quỳnh Hương", "Thiên Hương", "Ái Khanh", "Kim Khánh", "Vân Khánh", "Hồng Khuê",
    "Minh Khuê", "Diễm Kiều", "Chi Lan", "Bạch Liên", "Ngọc Liên", "Mộc Miên", "Hà Mi", "Thương Nga",
    "Đại Ngọc", "Thu Nguyệt", "Uyển Nhã", "Yến Oanh", "Thục Quyên", "Hạnh San", "Thanh Tâm", "Tú Tâm",
    "Song Thư", "Cát Tường", "Lâm Tuyền", "Hương Thảo", "Dạ Thi", "Anh Thư", "Đoan Trang", "Phượng Vũ",
    "Tịnh Yên", "Hải Yến", "Thiên Ân", "Gia Bảo", "Thành Công", "Trung Dũng", "Thái Dương", "Hải Đăng",
    "Thành Đạt", "Thông Đạt", "Phúc Điền", "Tài Đức", "Mạnh Hùng", "Chấn Hưng", "Bảo Khánh", "Khang Kiện",
    "Đăng Khoa", "Tuấn Kiệt", "Thanh Liêm", "Hiền Minh", "Thiện Ngôn", "Thụ Nhân", "Minh Nhật", "Nhân Nghĩa",
    "Trọng Nghĩa", "Trung Nghĩa", "Khôi Nguyên", "Hạo Nhiên", "Phương Phi", "Thanh Phong", "Hữu Phước",
    "Minh Quân", "Đông Quân", "Sơn Quân", "Tùng Quân", "Ái Quốc", "Thái Sơn", "Trường Sơn", "Thiện Tâm",
    "Thạch Tùng", "An Tường", "Anh Thái", "Thanh Thế", "Chiến Thắng", "Toàn Thắng", "Minh Triết", "Đình Trung",
    "Kiến Văn", "Nhân Văn", "Khôi Vĩ", "Quang Vinh", "Uy Vũ"
  ];
const emails = [  "nguyenthihue1@gmail.com",
    "tranvanb2@yahoo.com",
    "lethic3@outlook.com",
    "phamvand4@gmail.com",
    "hoangthie5@yahoo.com",
    "dieuanh1@gmail.com",
  "quynhanh2@yahoo.com",
  "tramanh3@outlook.com",
  "nguyetcat4@gmail.com",
  "tranchau5@yahoo.com",
  "quechi6@outlook.com",
  "trucchi7@gmail.com",
  "xuyenchi8@yahoo.com",
  "thiendi9@outlook.com",
  "ngocdiep10@gmail.com",
  "linhdan11@yahoo.com",
  "thucdaoan12@gmail.com",
  "thugiang13@outlook.com",
  "thienha14@gmail.com",
  "hieuhanh15@yahoo.com",
  "thaihoa16@gmail.com",
  "dathuong17@yahoo.com",
  "anhthu18@gmail.com",
  "thanhthu19@outlook.com",
  "chienthang20@gmail.com",
  "toanthang21@yahoo.com",
  "minhtriet22@gmail.com",
  "dinhtrung23@outlook.com",
  "kienvan24@gmail.com",
  "nhanvan25@yahoo.com",
  "khoivy26@outlook.com",
  "quangvinh27@gmail.com",
  "uyvu28@yahoo.com",
  "minhkhu29@gmail.com",
  "diemkieu30@yahoo.com",
  "chilan31@outlook.com",
  "bachlien32@gmail.com",
  "ngoclien33@yahoo.com",
  "mocmien34@outlook.com",
  "hami35@gmail.com",
  "thuongnga36@yahoo.com",
  "dainguyen37@outlook.com",
  "anhthu38@gmail.com",
  "doan39@yahoo.com",
  "phuongvu40@outlook.com",
  "tinhyen41@gmail.com",
  "huyennguyen42@yahoo.com",
  "thuynguyen43@outlook.com",
  "thuyennguyen44@gmail.com",
  "thuyennguyen45@yahoo.com",
  "thuyennguyen46@outlook.com",
  "thuyennguyen47@gmail.com",
  "thuyennguyen48@yahoo.com"
];
const interests = ["music", "travel", "reading", "cooking", "football", "movies"];
const genders = ["men", "women", "other"];
const ethnicities = ["Kinh", "Hoa", "Khmer", "Cham", "M'Nong", "Thai", "Chu Ru", "Chu Mu", "Chu Nom"]
const languages = ["vi", "en", "ja"];
const companies = ["CÔNG TY TNHH SẢN XUẤT VÀ PHÂN PHỐI TECH AIR", "CÔNG TY TNHH THỰC PHẨM QUÂN NGUYỄN", "CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ ĐẠI PHÚC"];
const schools = [
    "Trường đại học công nghệ",
    "Trường đại học y",
    "Đại học bách khoa hà nội",
    "Trường đại học công nghiệp",
    "Trường đại học nội vụ",
    "Trường đại học nông nghiệp",
    "Trường đại học tài nguyên môi trường",
    "Trường đại học xây dựng",
    "Trường đại học thủ đô",
    "Trường đại học Quốc Gia",
    "Trường đại học giao thông vận tải",
    "Trường đại học công nghệ giao thông vận tải",
    "Trường đại học công nghiệp dệt may Hà Nội",
    "Trường đại học dược Hà nội",
    "Trường đại học Đại Nam",
    "Trường đại học Điện lực",
    "Trường đại học Luật Hà Nội",
    "Trường đại học mở Hà Nội",
    "Trường đại học Mỹ Thuật Việt Nam",
    "Trường đại học Ngoại Thương",
    "Trường đại học phương đông",
    "Trường đại học Nguyễn Trãi",
    "Trường đại học Y tế công cộng",
    "Trường đại học Thương mại",
    "Trường đại học thủy lợi",
    "Trường đại học thành đô",
    "Trường đại học thăng long",
    "Trường đại học sư phạm hà nội",
    "Trường đại học sân khấu điện ảnh",
    "Học viện báo trí và tuyên truyền",
    "Học viện bưu chính viên thông",
    "Học viện hành chính quốc gia",
    "Học viện tài chính",
    "Học viện tòa án",
    "Học viện Y dược học cổ truyền Việt Nam",
    "Học viện quản lý giáo dục",
    "Học viện ngân hàng",
    "Học viện ngoại giao",
    "Học viện kỹ thuật mật mã",
    "Học viện thanh thiếu niên Việt Nam",
    "Học viện âm nhạc Quốc Gia Việt Nam",
    "Học viện Phụ nữ Việt Nam"
];
const educationLevels = ["Bachelor", "Master"];
const drinkingOpts = ["no", "sometimes", "yes"];
const smokingOpts = ["no", "yes"];
const showOpts = [true, false];
const topics = ["music", "travel", "reading", "cooking"];
const now = Date.now();

let users = [];

for (let i = 1; i <= 50000; i++) {
  let fullname = randomFromArray(names) + " " + i;
  let email = `user${i}@${randomFromArray(emails)}`;
  let oAuth2Id = "UID" + pad(i, 5);
  let _id = "01JZHX" + pad(i, 16);
  let dob = new Date(1990 + (i % 20), (i % 12), (i % 28) + 1).toISOString();
  let lat = (10 + Math.random() * 10).toFixed(6);
  let long = (100 + Math.random() * 10).toFixed(6);
  let languageArr = [randomFromArray(languages), randomFromArray(languages)];
  let interestArr = [randomFromArray(interests), randomFromArray(interests)];
  let ethnicityArr = [randomFromArray(ethnicities)];
  let topicArr = [randomFromArray(topics), randomFromArray(topics)];
  let gender = randomFromArray(genders);

  users.push({
    "_id": _id,
    "profiles": {
      "showCommon": {
        "showSexual": randomFromArray(showOpts),
        "showGender": randomFromArray(showOpts),
        "showAge": randomFromArray(showOpts),
        "showHeight": randomFromArray(showOpts),
        "showEthnicity": randomFromArray(showOpts),
        "showChildrenPlan": randomFromArray(showOpts),
        "showFamilyPlan": randomFromArray(showOpts),
        "showWork": randomFromArray(showOpts),
        "showSchool": randomFromArray(showOpts),
        "showEducation": randomFromArray(showOpts),
        "showDrinking": randomFromArray(showOpts),
        "showSmoking": randomFromArray(showOpts),
        "showDrug": randomFromArray(showOpts),
        "showDistance": randomFromArray(showOpts)
      },
      "interests": interestArr,
      "orientationSexuals": [gender],
      "languages": languageArr,
      "ethnicitys": ethnicityArr,
      "smartPhoto": randomFromArray(showOpts),
      "favoriteSongs": ["Song " + i, "Song " + (i + 1)],
      "gender": gender,
      "address": randomFromArray(["Hà Nội", "TP.HCM", "Đà Nẵng"]),
      "height": 150 + (i % 50),
      "childrenPlan": String(1 + (i % 3)),
      "familyPlan": randomFromArray(["open", "not sure", "yes"]),
      "company": randomFromArray(companies),
      "school": randomFromArray(schools),
      "education": randomFromArray(educationLevels),
      "drinking": randomFromArray(drinkingOpts),
      "smoking": randomFromArray(smokingOpts),
      "drug": randomFromArray(smokingOpts)
    },
    "settings": {
      "global": {
        "isEnabled": randomFromArray(showOpts),
        "languages": languageArr
      },
      "distancePreference": {
        "range": 10 + (i % 20),
        "unit": "km",
        "onlyShowInThis": randomFromArray(showOpts)
      },
      "agePreference": {
        "min": 15,
        "max": 30 + (i % 10),
        "onlyShowInThis": randomFromArray(showOpts)
      },
      "notiSeenEmail": {
        "newMatchs": randomFromArray(showOpts),
        "incomingMessage": randomFromArray(showOpts),
        "promotions": randomFromArray(showOpts)
      },
      "notiSeenApp": {
        "newMatchs": randomFromArray(showOpts),
        "incomingMessage": randomFromArray(showOpts),
        "promotions": randomFromArray(showOpts),
        "superLike": randomFromArray(showOpts)
      },
      "genderFilter": randomFromArray(["all", "men", "women"]),
      "autoPlayVideo": randomFromArray(["always", "wifi", "no"]),
      "showTopPick": randomFromArray(showOpts),
      "showOnlineStatus": randomFromArray(showOpts),
      "showActiveStatus": randomFromArray(showOpts),
      "incognitoMode": randomFromArray(showOpts)
    },
    "plusCtrl": {
      "whoYouSee": randomFromArray(["default", "everyone"]),
      "whoSeeYou": randomFromArray(["default", "everyone"])
    },
    "explore": {
      "verified": randomFromArray([0, 1]),
      "topics": topicArr
    },
    "verifyStatus": randomFromArray(showOpts),
    "onlineNow": randomFromArray(showOpts),
    "activeStatus": randomFromArray(showOpts),
    "disable": false,
    "coins": Math.floor(Math.random() * 1000),
    "numberLike": Math.floor(Math.random() * 100),
    "numberSuperLike": Math.floor(Math.random() * 20),
    "numberBooster": Math.floor(Math.random() * 10),
    "lastPasswordChange": now,
    "oAuth2Id": oAuth2Id,
    "fullname": fullname,
    "email": email,
    "dob": dob,
    "location": {
      "lat": lat,
      "long": long
    },
    "languageMachine": randomFromArray(languages),
    "insert": {
      "when": new Date(now - Math.floor(Math.random() * 1000000000)).toISOString()
    },
    "__v": 0
  });
}

fs.writeFileSync('bachasoft.customers.generated.json', JSON.stringify(users, null, 2));
console.log('Đã tạo file bachasoft.customers.generated.json với 50000 user!');