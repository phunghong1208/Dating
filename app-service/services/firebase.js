'use strict';

const admin = require('firebase-admin');
const to = require('await-to-js').default;
const serviceAccount = require('../../firebaseAccountKey.json');
const BaseService = require('./Base');

class Service extends BaseService {
  constructor() {
    super(Service);
    this.init();
  }

  init() {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL:
        'https://heartlink-dating-project-default-rtdb.firebaseio.com',
    });
  }

  async verifyUID(idToken) {
    let [errVerify, dataVerify] = await to(admin.auth().verifyIdToken(idToken));
    const uid = dataVerify?.uid;
    if (errVerify) {
      let { code, message } = errVerify;
      throw Error(JSON.stringify({ msgKey: code, message }));
    }
    if (!dataVerify || !dataVerify.uid || dataVerify.disabled)
      throw Error(JSON.stringify({ message: 'Firebase: IdToken invalid.' }));

    let [err, data] = await to(admin.auth().getUser(uid));

    if (err) {
      let { code, message } = err;
      throw Error(JSON.stringify({ msgKey: code, message }));
    }
    if (!data || !data.uid || data.disabled)
      throw Error(JSON.stringify({ message: 'Firebase: Not user found.' }));

    return data;
  }

  async pushCloudMessaging(devices, senderName, messageData, dataSend) {
    console.log(devices, senderName, messageData);
    const message = {
      notification: {
        title: senderName,
        body: messageData,
      },
      data: dataSend, // Hoặc thêm các thuộc tính khác
    };
    devices.map(async token => {
      console.log('token-push', token);
      message.token = token;
      await admin
        .messaging()
        .send(message)
        .then(response => {
          console.log('response', response);
          console.log(
            'Thông báo đã được gửi thành công tới thiết bị có token:',
            token,
          );
        })
        .catch(error => {
          console.log(
            'Gặp lỗi khi gửi thông báo tới thiết bị có token:',
            token,
            error,
          );
        });
    });
  }
}

module.exports = new Service();
