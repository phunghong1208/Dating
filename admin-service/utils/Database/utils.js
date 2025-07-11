// Khi mongooes ko đáp ứng được thì chuyển qua dùng mongodb native
const MongoClient = require('mongodb').MongoClient;
const { dbConnectURI, options } = require('../../config').mongodb;
const TAG = 'DBUtils';

module.exports = {
  getNativeDb() {
    return new Promise((resolve, reject) => {
      MongoClient.connect(dbConnectURI, options, (err, db) => {
        if (err) return reject(err);
        resolve(db);
      });
    });
  },

  getNativeCollection(name) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(dbConnectURI, options, (err, db) => {
        if (err) return reject(err);
        resolve(db.collection(name));
      });
    });
  },
};
