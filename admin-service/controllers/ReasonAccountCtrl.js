'use strict';

const to = require('await-to-js').default;
const BaseController = require('./BaseController');
const ReasonAccount = require('../models/ReasonAccount');
const HttpUtil = require('../utils/http');
const Static = require('../models/Static');

/*
  Xem hàm mẫu BaseController nếu muốn viết lại các action
*/
class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.mReasonAccount = ReasonAccount;
    this.mStatic = Static;
  }

  async getListReasonAccount(req, res) {
    let { language = 'en' } = req.headers;
    let [err, data] = await to(this.mReasonAccount.getListReasonAccount(language));
    if (err) return HttpUtil.unprocessable(res, err);
    return HttpUtil.success(res, data);
  }

  async getCommonCtrl(req,res){
    let { language = 'en' } = req.headers;
    let [err, data] = await to(this.mStatic.getCommon(language));
    if (err) return HttpUtil.unprocessable(res, err);
    return HttpUtil.success(res, data);
  }

  async getBasicInfosCtrl(req, res) {
    let { language = 'en' } = req.headers;
    let [err, data] = await to(this.mStatic.getBasicInfos(language));
    if (err) return HttpUtil.unprocessable(res, err);
    return HttpUtil.success(res, data);
  }

  async getLifeStyleInfosCtrl(req, res) {
    let { language = 'en' } = req.headers;
    let [err, data] = await to(this.mStatic.getLifeStyleInfos(language));
    if (err) return HttpUtil.unprocessable(res, err);
    return HttpUtil.success(res, data);
  }

  async getStaticPromptsCtrl(req, res) {
    let { language = 'en' } = req.headers;
    let [err, data] = await to(this.mStatic.getStaticPromptModel(language));
    if (err) return HttpUtil.unprocessable(res, err);
    return HttpUtil.success(res, data);
  }
}

module.exports = new Controller();
