const Utils = require('./index');
const HttpCode = require('./const').httpCode;

module.exports = {
  params(req) {
    let p = {};
    Object.assign(p, req.query); // try to get from url query string, e.g api/users?param1=x&param2=y
    Object.assign(p, req.body); // try to get from json
    return p;
  },

  headers(req) {
    return {
      authUser: req.authUser,
      langCode: req.headers.language,
      roles: req.headers.roles,
      userAgent: req.headers['user-agent'],
      authorization: req.headers.authorization,
      timezone: req.headers.timezone,
      other: req.headers,
    };
  },

  getLanguage(req) {
    return req.headers.language;
  },

  getTimezone(req) {
    return req.headers.timezone;
  },

  getBaseUrl(req) {
    return `http://${req.headers.host}`;
  },

  getParamsFull: function (req) {
    let p = {};
    Object.assign(p, req.params); // try to get from url parameters, e.g api/users/:id
    Object.assign(p, req.query); // try to get from url query string, e.g api/users?param1=x&param2=y
    Object.assign(p, req.body); // try to get from json
    return p;
  },

  // req: request object of express
  getFullUrlFromRequest(req) {
    return req.protocol + '://' + req.get('host') + req.originalUrl;
  },

  // params from url get /api/users?sort=email,1
  // return {email: 1}
  parseSort(paramSort, defaultSort = { 'insert.when': -1 }) {
    let sort;
    if (paramSort) {
      let arr = paramSort.split(',');
      if (arr.length === 2) {
        let sortName = arr[0].trim();
        let sortValue = Number(arr[1]);
        if ((sortValue === 1 || sortValue === -1) && sortName.length > 0) {
          sort = { [sortName]: sortValue };
        }
      }
    }
    return sort || defaultSort;
  },

  getRequiredParamsFromJson(req, required_param_names) {
    return this.checkRequiredParams(req.body, required_param_names);
  },

  getRequiredParamsFromJson2(req, required_param_names) {
    return this.checkRequiredParams2(req.body, required_param_names);
  },

  getRequiredParamsFromUrl(req, required_param_names) {
    return this.checkRequiredParams(req.query, required_param_names);
  },

  getRequiredParams(req, required_param_names) {
    const params = this.getParamsFull(req);
    return this.checkRequiredParams(params, required_param_names);
  },

  getRequiredParams2(req, required_param_names) {
    const params = this.getParamsFull(req);
    return this.checkRequiredParams2(params, required_param_names);
  },

  createErrorInvalidInput(msgOrKey, words = null) {
    return this.createError(HttpCode.BAD_REQUEST, msgOrKey, words);
  },

  createError(code, key, words = null) {
    if (words) {
      let { msgKey, message } = Utils.getMsgObjectFromKey(key, words);
      return { code, msgKey, message };
    }
    return { code, message: Utils.localizedText(key) };
  },

  // các trường hợp sử dụng thường gặp
  // error(500, res, err)
  error(httpStatus, res, err, opt_info = null) {
    let { langCode } = this.headers(res.req);
    let data = {};
    if (Utils.isString(err)) {
      data = Utils.getMsgObjectFromKey(err, null, langCode);
    } else {
      if (Utils.isObject(err)) {
        let { msg, words, msgKey, message } = err;
        if (msg) {
          data = Utils.getMsgObjectFromKey(msg, words, langCode);
        } else {
          data = { msgKey, message };
        }
      } else {
        data.message = Utils.getErrorString(err);
      }
    }
    if (opt_info) data.extra_info = opt_info;
    _error(res, httpStatus, data);
  },

  badRequest(res, err, opt_info = null) {
    if (!err) err = 'Bad_Request';
    return this.error(HttpCode.BAD_REQUEST, res, err, opt_info);
  },

  disableApi(res, msg) {
    msg = msg || 'Disable_Api';
    return this.badRequest(res, msg);
  },

  forbidden(res, err, opt_info = null) {
    if (!err) err = 'Forbidden';
    return this.error(HttpCode.FORBIDDEN, res, err, opt_info);
  },

  notFound(res, err, opt_info = null) {
    if (!err) err = 'Not_Found';
    return this.error(HttpCode.NOT_FOUND, res, err, opt_info);
  },

  notImplement(res, msg = null) {
    msg = msg || 'Not_Implement';
    return this.internalServerError(res, msg);
  },

  unauthorized(res, err, opt_info = null) {
    if (!err) err = 'unauthorized';
    return this.error(HttpCode.UNAUTHORIZED, res, err, opt_info);
  },

  unprocessable(res, err, opt_info = null) {
    if (!err) err = 'unprocessable';
    return this.error(HttpCode.UNPROCESSABLE_ENTITY, res, err, opt_info);
  },

  internalServerError(res, err, opt_info = null) {
    if (!err) err = 'Internal_Server_Error';
    return this.error(HttpCode.INTERNAL_SERVER_ERROR, res, err, opt_info);
  },

  /*
   * using forward response from others service
   */
  forwardResponse(
    res,
    { code = HttpCode.OK, message = 'Success', data = null },
  ) {
    if (code === HttpCode.OK)
      return this.sendResponse(res, code, { message, data });
    return this.error(code, res, { message });
  },

  sendResponse(res, status, content = null) {
    res.set('Access-Control-Allow-Origin', '*');
    res.status(status);
    res.json(content);
  },

  success(res, data = null, msgOrKey = null, httpStatus = HttpCode.OK) {
    let { langCode } = this.headers(res.req);
    let ret = Utils.getMsgObjectFromKey(
      msgOrKey || 'Success.general',
      null,
      langCode,
    );
    if (data) {
      if (Utils.isString(data)) {
        ret = Utils.getMsgObjectFromKey(data, null, langCode);
      } else {
        if (Utils.isObject(data)) {
          if (Utils.isArray(data)) {
            ret.count = data.length;
          } else {
            if (Object.keys(data).length === 0) {
              data = undefined;
            } else {
              if (!msgOrKey) {
                let { msg, words, message } = data;
                if (message) {
                  ret = { message };
                  delete data.message;
                }
                if (msg) {
                  ret = Utils.getMsgObjectFromKey(msg, words, langCode);
                  delete data.msg;
                  delete data.words;
                }
              }
            }
          }
        }
        ret.data = data;
      }
    }
    return this.sendResponse(res, httpStatus, ret);
  },

  download(res, options) {
    res.download(options.path, options.filename);
  },

  ddd: function (input) {
    return Promise.resolve(input);
  },

  checkRequiredParams(input, requiredParams) {
    if (!requiredParams) return input;
    if (!Array.isArray(requiredParams))
      return {
        error: `Required params must be array, but value is ${requiredParams}`,
      };
    if (requiredParams.length === 0) return input;
    for (let i = 0; i < requiredParams.length; i++) {
      let keys = requiredParams[i].split('.');
      let obj = input[keys[0]];
      let path = keys[0];
      if (obj === undefined || obj === null) {
        return { error: 'Missing param ' + path };
      }
      if (keys.length <= 1) {
        continue;
      }
      for (let j = 1; j < keys.length; j++) {
        path = path + '.' + keys[j];
        obj = obj[keys[j]];
        if (obj === undefined || obj === null) {
          return { error: 'Missing param ' + path };
        }
      }
    }
    return input;
  },

  // Bình thường thì sẽ ko chấp nhận empty string
  // Nếu param nào empty mà có acceptEmpty = true thì sẽ chấp nhận param đấy
  // example of requiredParams:
  // [
  //   {
  //     name: 'staff_type',
  //     acceptValues: [1, 2, 3],
  //     dataType: 'array'
  //   },
  //   'name.familyName',
  //   'skype'
  // ]
  //
  // input should be this
  // {
  //   staff_type: 1,
  //   skype: "xxx",
  //   name : {
  //     familyName: "John"
  //   }
  // }
  checkRequiredParams2(input, requiredParams) {
    if (!requiredParams) return input;
    if (!Array.isArray(requiredParams))
      return {
        error: `Required params must be array, but value is ${requiredParams}`,
      };
    if (requiredParams.length === 0) return input;
    // dataType: must be result from typeof (E.g: 'string', 'number', 'boolean', 'array'...)
    // acceptEmpty: áp dụng cho cả string và array, để chấp nhận mảng rỗng và string rỗng
    function check(value, key, acceptValues, acceptEmpty, dataType, message) {
      let msg =
        message && message.acceptEmpty
          ? message.acceptEmpty
          : 'Param ' + key + ' is missing or empty';
      if (dataType) {
        let errMsg = key + ' must be ' + dataType + ', but value is ' + value;
        if (dataType === 'objectId') {
          if (!value) return msg;
          if (!Utils.isValidObjectId(value)) return errMsg;
        }
        if (dataType === 'array') {
          if (!Array.isArray(value)) return errMsg;
          if (!acceptEmpty && value.length === 0) return msg;
        }
        if (dataType === 'number' && isNaN(value)) return errMsg;
        if (dataType === 'boolean' && !Utils.isBoolean(Utils.toBool(value)))
          return errMsg;
        if (
          ['array', 'number', 'boolean', 'objectId'].indexOf(dataType) === -1 &&
          dataType !== typeof value
        )
          return errMsg;
        if (
          dataType === 'object' &&
          Object.keys(value).length === 0 &&
          !acceptEmpty
        )
          return msg;
      }
      if (!value && dataType !== 'number' && dataType !== 'boolean') {
        if (acceptEmpty === true) {
          if (value === '' && (dataType === undefined || dataType === 'string'))
            return null;
        }
        return msg;
      }
      if (acceptValues && acceptValues.indexOf(value) === -1) {
        return message && message.acceptValue
          ? message.acceptValue
          : 'Value of ' + key + ' is invalid';
      }
      return null;
    }
    for (let p of requiredParams) {
      let obj, path;
      let fullPath = Utils.isString(p) ? p : p.name;
      let keys = fullPath.split('.');
      for (let j = 0; j < keys.length; j++) {
        let key = keys[j];
        if (j === 0) {
          obj = input[key];
          path = key;
        } else {
          obj = obj[key];
          path = path + '.' + key;
        }
        let msg;
        if (j === keys.length - 1) {
          // last node
          msg = check(
            obj,
            path,
            p.acceptValues,
            p.acceptEmpty,
            p.dataType,
            p.message,
          );
          if (!msg) {
            if (p.dataType === 'number' && !Utils.isNumber(obj)) {
              // make sure dataType is exactly number
              Utils.setObjectPropertyWithPath(path, input, Number(obj));
            }
            if (p.dataType === 'boolean' && !Utils.isBoolean(obj)) {
              // make sure dataType is exactly boolean
              Utils.setObjectPropertyWithPath(path, input, Utils.toBool(obj));
            }
          }
        } else {
          // middle node
          msg = check(obj, path);
        }
        if (msg) {
          return { error: msg };
        }
      }
    }
    return input;
  },

  checkRequiredParamsIfAvailable(input, requiredParams) {
    if (!requiredParams) return input;
    if (!Array.isArray(requiredParams))
      return {
        error: `Required params must be array, but value is ${requiredParams}`,
      };
    if (requiredParams.length === 0) return input;

    let required = [];
    for (let p of requiredParams) {
      let fullPath = Utils.isString(p) ? p : p.name;
      let keys = fullPath.split('.');
      let obj = { ...input },
        path;
      for (let j = 0; j < keys.length; j++) {
        path = keys[j];
        obj = obj[path];
      }
      if (typeof obj === 'undefined') {
        continue;
      }
      required.push(p);
    }
    return this.checkRequiredParams2(input, required);
  },
};

function _error(res, httpStatus, data) {
  res.status(httpStatus).send(data);
}
