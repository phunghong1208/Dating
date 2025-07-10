'use strict';

const to = require('await-to-js').default;
const BaseController = require('../../../Base');
const HttpUtil = require('../../../utils/http');
const { verifyUID } = require('../../services/firebase');
const {
  sendOtpCode,
  getCards,
  getProfile,
  getUserProfile,
  getAvaiableDescriptors,
  cloneAvaiableDescriptors,
  cloneInterests,
} = require('../../services/tinder');
const Socket = require('../../models/Socket');

class Controller extends BaseController {
  constructor() {
    super(Controller);
  }

  async verifyTokenId(req, res) {
    const requireParams = ['idToken'];
    let params = this.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return this.throwBadRequest(res, params.error);

    let { idToken } = params;
    let [err, data] = await to(verifyUID(idToken));
    if (err) return this.throwBadRequest(res, JSON.parse(err.message));
    return this.success(res, { data });
  }

  async getTinderOtpCode(req, res) {
    let { phone_number } = req.body;
    let [err, data] = await to(sendOtpCode(phone_number));
    if (err) return this.throwInternalError(res, err);
    return this.success(res, { data });
  }

  async fetchCards(req, res) {
    let { api_key } = req.body;
    let [err, data] = await to(getCards(api_key));
    if (err) return this.throwInternalError(res, err);
    return this.success(res, { data });
  }

  async getOwnerTinder(req, res) {
    let { api_key, lang, raw = false } = req.body;
    let [err, data] = await to(getProfile(api_key, lang, raw));
    if (err) return this.throwInternalError(res, err);
    return this.success(res, { data });
  }

  async getUserTinder(req, res) {
    let { api_key, uid } = req.body;
    let [err, data] = await to(getUserProfile(uid, api_key));
    if (err) return this.throwInternalError(res, err);
    return this.success(res, { data });
  }

  async getAvailableDescriptors(req, res) {
    let { api_key, lang } = req.body;
    let [err, data] = await to(getAvaiableDescriptors(api_key, lang));
    if (err) return this.throwInternalError(res, err);
    return this.success(res, { data });
  }

  async cloneAvaiableDescriptors(req, res) {
    let { api_key } = req.body;
    let [err, data] = await to(cloneAvaiableDescriptors(api_key));
    if (err) return this.throwInternalError(res, err);
    return this.success(res, { data });
  }

  async cloneInterests(req, res) {
    let { api_key } = req.body;
    let [err, data] = await to(cloneInterests(api_key));
    if (err) return this.throwInternalError(res, err);
    return this.success(res, { data });
  }

  async getSessionSokets(req, res) {
    let params = this.checkRequiredParams2(req.params, ['id']);
    if (params.error) return this.throwBadRequest(res, params.error);
    let data = await Socket.getByClientId(params.id);
    return this.success(res, { data });
  }
}

module.exports = new Controller();
