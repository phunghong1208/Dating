'use strict';

const to = require('await-to-js').default;
const HttpUtil = require('../utils/http');
const BaseController = require('../Base');
const Service = require('../services/static');
const API_KEY = 'bachaxPPsb9SCaz7TVJsda7cCD5sshsoft';
class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.service = Service;
  }

  async getLocations(req, res) {
    let [err, data] = await to(this.service.getLocations());
    if (err) return HttpUtil.unprocessable(res, err);
    return HttpUtil.success(res, data);
  }

  // get infors for page register
  async getStaticInfos(req, res) {
    let msg = this.validateReq(req);
    if (msg) return HttpUtil.unauthorized(res, msg);

    let { language = 'en' } = req.headers;
    let [err, data] = await to(this.service.getPreStatics(language));
    if (err) return HttpUtil.unprocessable(res, err);
    return HttpUtil.success(res, data);
  }

  async getStaticPrompts(req, res) {
    let { language = 'en' } = req.headers;
    let [err, data] = await to(this.service.getStaticPrompts(language));
    if (err) return HttpUtil.unprocessable(res, err);
    return HttpUtil.success(res, data);
  }

  validateReq(req) {
    const apiHashKey = req.headers['content-transfer-encoding'];
    // console.log("apiHashKey", apiHashKey, new Date().toISOString());
    var err = null;
    if (!apiHashKey || apiHashKey.indexOf(API_KEY) == -1)
      err = 'Invalid Request';
    return err;
  }
}

module.exports = new Controller();
