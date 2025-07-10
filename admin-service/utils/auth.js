const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { SECRET_KEY, SECRET_KEY_APP } = require('../../config/env/auth');

module.exports = {
  randomValueHex(len = 16) {
    return crypto
      .randomBytes(len)
      .toString('hex') // convert to hexadecimal format
      .slice(0, len); // return required number of characters
  },

  randomValueBase64(len) {
    return crypto
      .randomBytes(Math.ceil((len * 3) / 4))
      .toString('base64') // convert to base64 format
      .slice(0, len) // return required number of characters
      .replace(/\+/g, '0') // replace '+' with '0'
      .replace(/\//g, '0'); // replace '/' with '0'
  },

  hash(string, salt) {
    return crypto.pbkdf2Sync(string, salt, 1000, 64, 'sha512').toString('hex');
  },

  setPassword(password) {
    password = password.toString();
    let salt = this.randomValueHex();
    let hash = this.hash(password, salt);
    return { salt, hash };
  },

  validPassword(user, password) {
    let hash = this.hash(password, user.salt);
    return user.hash === hash;
  },

  generateJwt(user) {
    let expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    return jwt.sign(
      {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        exp: parseInt(expiry.getTime() / 1000),
      },
      SECRET_KEY,
    ); // DO NOT KEEP YOUR SECRET IN THE CODE!
  },

  verify(token, cb) {
    jwt.verify(token, SECRET_KEY, (err, payload) => {
      if (err) return cb(err);
      return cb(null, payload);
    });
  },

  generateJwtApp(user) {
    let expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    return jwt.sign(
      {
        _id: user._id,
        oAuth2Id: user.oAuth2Id,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        exp: parseInt(expiry.getTime() / 1000),
      },
      SECRET_KEY_APP,
    ); // DO NOT KEEP YOUR SECRET IN THE CODE!
  },

  verifyJwtApp(token, cb) {
    jwt.verify(token, SECRET_KEY_APP, (err, payload) => {
      if (err) return cb(err);
      return cb(null, payload);
    });
  },

  verifyToken(token, isAppToken = false) {
    let secretKey = isAppToken ? SECRET_KEY_APP : SECRET_KEY;
    return new Promise((resolve, reject) => {
      jwt.verify(token, secretKey, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      });
    });
  },
};
