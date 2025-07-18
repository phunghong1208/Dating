const _ = require('lodash');
const URL = require('url');
const path = require('path');
const lang = require('../langs');
const DefaultLangCode = process.env.LANG_DEV || 'en';
const ObjectId = require('mongoose').Types.ObjectId;
const { ulid } = require('ulid');

// Validator ObjectId
function _isValidObjectId(id) {
  let isValid = false;
  if (ObjectId.isValid(id)) {
    if (String(new ObjectId(id)) === id) isValid = true;
  }
  return isValid;
}

module.exports = {
  getCreateBy(authUser) {
    return {
      when: Date.now(),
      by: authUser ? authUser._id : undefined,
    };
  },

  generateULID() {
    return ulid();
  },

  toObjectId(id) {
    return new ObjectId(id);
  },

  isValidObjectId(_id) {
    return _isValidObjectId(_id.toString());
  },

  localizedText(key, words = null, langcode = null) {
    if (!langcode) langcode = DefaultLangCode;
    let txt = _.get(lang[langcode], key) || key;
    if (!words) return txt;
    return replace(txt, words);
  },

  getMsgObjectFromKey(key, words = null, langcode = null) {
    let message = this.localizedText(key, words, langcode);
    return {
      msgKey: key,
      message: message,
    };
  },

  getUiMsgFromKey(key, words = null, langcode = null) {
    return this.getMsgObjectFromKey(key, words, langcode)['message'];
  },

  formatUrl(url) {
    if (!url) return null;
    let { protocol, host } = URL.parse(url);
    if (protocol) return `${protocol}//${host}`;
    return `http://${url}`;
  },

  fillOptionalFields(from, to, opsFields) {
    for (const key of opsFields) {
      if (from[key] !== undefined) {
        to[key] = from[key];
        if (typeof to[key] === 'string') {
          to[key] = to[key].trim();
        }
      }
    }
    return to;
  },

  getAcceptableFieldsName(acceptableFields) {
    let str = '';
    for (let i = 0; i < acceptableFields.length; i++) {
      let name = '';
      if (typeof acceptableFields[i] === 'string') {
        name = acceptableFields[i];
      } else {
        name = acceptableFields[i].name;
      }
      if (str.length > 0) {
        str += ', ';
      }
      str += name;
    }
    return str;
  },

  getAcceptableFields(from, acceptableFields) {
    const result = {};
    for (const keyPath of acceptableFields) {
      let fullPath = typeof keyPath === 'string' ? keyPath : keyPath.name;
      const value = this.getObjectPropertyWithPath(fullPath, from);
      if (this.isUndefined(value)) {
        continue;
      }
      this.setObjectPropertyWithPath(fullPath, result, value);
    }
    return result;
  },

  // propertyPath: a string with format 'abc.def.ghi'
  getObjectPropertyWithPath(propertyPath, obj) {
    if (this.isUndefined(obj)) return undefined;
    let keys = propertyPath.split('.'),
      p = { ...obj };
    for (let i = 0; i < keys.length; i++) {
      if (!this.objectHasProperty(p, keys[i])) return undefined;
      if (this.isUndefined(p[keys[i]])) return undefined;
      p = p[keys[i]];
    }
    return p;
  },

  // propertyPath: a string with format 'abc.def.ghi'
  setObjectPropertyWithPath(propertyPath, obj, value) {
    if (!obj) obj = {};
    let keys = propertyPath.split('.'),
      p = obj;
    for (let i = 0; i < keys.length; i++) {
      if (i === keys.length - 1) {
        p[keys[i]] = value;
      } else {
        p[keys[i]] = p[keys[i]] || {};
        p = p[keys[i]];
      }
    }
    return obj;
  },

  getErrorString(error) {
    if (error === undefined || error === null) return error;
    if (typeof error === 'string' || error instanceof String) return error;
    if (error.message) return error.message;
    if (error.msgKey) return error.msgKey;
    return error.toString();
  },

  keepLastNItems(arr, n) {
    if (arr.length > n) return arr.slice(arr.length - n, arr.length);
    return arr;
  },

  // remove duplicate elements in array
  uniqElementsArray(arr) {
    return Array.from(new Set(arr));
  },

  onlyNumbersAndLetters(str) {
    if (typeof str != 'string') return str;
    return str.replace(/[^a-zA-Z0-9]/g, '');
  },

  // chỉ cho phép chữ cái, số và dấu -, _
  codeStringInvalid(str) {
    return /[^a-zA-Z0-9_-]/.test(str);
  },

  onlyNumbers(str) {
    if (typeof str != 'string') return str;
    return str.replace(/[^0-9]/g, '');
  },

  // format số dạng 0001
  zeroLeading(num, len) {
    let s = num.toString();
    while (s.length < len) s = '0' + s;
    return s;
  },

  // https://stackoverflow.com/questions/21284228/removing-control-characters-in-utf-8-string
  removeAllControlCharacters(str) {
    if (typeof str != 'string') return str;
    return str.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  },

  escapeRegExp(strToEscape) {
    // Escape special characters for use in a regular expression
    return strToEscape.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
  },

  trimChar(origString, charToTrim) {
    charToTrim = this.escapeRegExp(charToTrim);
    let regEx = new RegExp(
      '^[' + charToTrim + ']+|[' + charToTrim + ']+$',
      'g',
    );
    return origString.replace(regEx, '');
  },

  adjustSpaces(str, relacement = ' ') {
    if (!str) return null;
    // return str.trim().replace(/\s\s+/g, ' ');
    return str.replace(/\s+/g, relacement);
  },

  removeAllSpaces(str, relacement = '') {
    return this.adjustSpaces(str, relacement);
  },

  // Dùng cho log
  limitStrLen(str, len) {
    if (str.length <= len || len <= 3) return str;
    return str.substring(0, len - 3) + '...';
  },

  getBearerTokenFromHeader(req) {
    // if (req.session.token) {
    //   return {token: req.session.token}
    // }
    if (!req.headers.authorization) return { error: 'Missing access token' };
    let token = req.headers.authorization.trim();
    if (!token || token.length === 0) return { error: 'Missing access token' };
    const BEARER = 'Bearer';
    let index = token.indexOf(BEARER);
    if (index !== 0) return { error: 'Missing token type ' + BEARER };
    token = token.substring(BEARER.length, token.length);
    return { token: token.trim() };
  },

  getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  },

  getRandomIntBetween(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  },

  getRandomIntBetweenInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
  },

  getFileExtension(filename) {
    let { name, ext } = path.parse(filename);
    if (name.slice(-4) === '.tar') ext = `.tar${ext}`;
    return ext;
  },

  getUrlWithPort(url, port) {
    return port === 80 || port === 443 ? url : url + ':' + port;
  },

  // str: field in table relations
  // example: customer, customerId, customer_id --> Customer
  getModelName(str) {
    str = str.charAt(0).toUpperCase() + str.slice(1);
    return str.replace(/_id|Id/gi, '');
  },

  cloneObject(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  toBool(str) {
    if (str === true || str === 'true') return true;
    if (str === false || str === 'false') return false;
    return undefined;
  },

  isString(variable) {
    return typeof variable === 'string' || variable instanceof String;
  },

  isNumber(variable) {
    return (
      (typeof variable === 'number' || variable instanceof Number) &&
      !isNaN(variable)
    );
  },

  isBoolean(variable) {
    return typeof variable === 'boolean' || variable instanceof Boolean;
  },

  isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  },

  isInt(variable) {
    if (!this.isNumber(variable)) return false;
    if (isNaN(variable)) return false;
    let n = parseFloat(variable);
    return (0 | n) === n;
  },

  convertStringToBoolean(variable) {
    return Number(variable) === 1;
  },

  isArray(variable) {
    return Array.isArray(variable);
  },

  isFunction(variable) {
    return typeof variable === 'function';
  },

  isObject(variable) {
    return variable !== null && typeof variable === 'object';
  },

  isNull(variable) {
    return variable === null;
  },

  isUndefined(variable) {
    return variable === undefined;
  },

  isObjectEmpty(obj) {
    return Object.keys(obj).length === 0;
  },

  objectHasProperty(obj, key) {
    return obj.hasOwnProperty(key);
  },

  inArray(array, key) {
    // return array.indexOf(key) > -1
    return array.includes(key);
  },

  compareString(str_1, str_2) {
    return str_1 === str_2;
  },

  compareObjectId(id_1, id_2) {
    return id_1.toString() === id_2.toString();
  },

  // FORMAT: HH:mm:ss
  convertStringTime(time) {
    return `0${time}`.slice(-8);
  },

  sortArrayObject(arr, keySort) {
    return _.sortBy(arr, keySort);
    // return arr.sort((a, b) => a[keySort] < b[keySort] ? -1 : 1)
  },

  // format float number
  roundFloat(value, decimals = 3) {
    if (typeof decimals !== 'number') {
      decimals = 1;
    } else {
      decimals = parseInt(decimals);
    }
    return Number(
      Math.round(value.toPrecision(24) + 'e' + decimals) + 'e-' + decimals,
    );
  },

  formatJPAddress(address) {
    let result = address;
    let reg = new RegExp('^[0-9]{3}[- ]+[0-9]{4}', 'g');

    if (typeof address != 'string') return '';

    if (address.startsWith('日本、')) {
      result = address.replace('日本、', '');
    }

    if (result.startsWith('〒')) {
      result = result.replace('〒', '');
    }

    result = result.replace(reg, '');

    return result;
  },

  getDeviceStatus(player, langCode) {
    let status = this.localizedText('Common.online', null, langCode);
    if (!player.isConnected)
      status = this.localizedText('Common.offline', null, langCode);
    return status;
  },

  generateKeyFromText(str) {
    if (str && str.length) {
      let words = str.split(' ');
      words = words.map((word, i) => {
        word = word.toLowerCase();
        if (i > 0 && word.length > 1)
          word = word[0].toUpperCase() + word.substring(1);
        return word;
      });
      return words.join('');
    }
    return str;
  },

  distanceInKm(from, to) {
    return distance(from.lat, from.long, to.lat, to.long);
  },
};

const PLACEHOLDER = '%';

function replace(word = '', words = '') {
  let translation = word;
  const values = [].concat(words);
  values.forEach((e, i) => {
    translation = translation.replace(PLACEHOLDER.concat(i), e);
  });
  return translation;
}

function distance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1); // deg2rad below
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
