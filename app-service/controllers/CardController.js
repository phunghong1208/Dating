'use strict';

const to = require('await-to-js').default;
const HttpUtil = require('../utils/http');
const BaseController = require('../Base');
const Service = require('../services/cards');
const ServiceAI = require('../services/ai');

class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.service = Service;
    this.serviceAI = ServiceAI;
  }

  async index(req, res) {
    let authUser = req.authUser;
    let options = this.handleFilter(req);
    let [err, lists] = await to(this.service.getLists(options, authUser));

    if (err) return HttpUtil.internalServerError(res, err);
    return HttpUtil.success(res, lists);
  }

  /**
   * Clone Data Image
   * @param {*} req
   * @param {*} res
   * @returns
   */
  async getCardImage(req, res) {
    let authUser = req.authUser;
    let options = this.handleFilter(req);
    let [err, lists] = await to(
      this.service.getListsCardClone(options, authUser),
    );

    if (err) return HttpUtil.internalServerError(res, err);
    return HttpUtil.success(res, lists);
  }

  async getRecommends(req, res) {
    let authUser = req.authUser;
    let options = this.handleFilter(req);
    let [err, lists] = await to(
      this.serviceAI.getRecommends(options, authUser),
    );
    if (err) return HttpUtil.internalServerError(res, err);
    return HttpUtil.success(res, lists);
  }

  // explore: {
  //   verified: { type: Boolean, default: false }, // Xác minh người thật bằng camera, face ID
  //   topics: [String], // Lưu thông tin các topics đã join
  // },
  async getVerifiedLists(req, res) {
    let authUser = req.authUser;
    let options = this.handleFilter(req);
    // options.filter = { 'explore.verified': true };
    let [err, lists] = await to(
      this.serviceAI.getListVerified(options, authUser),
    );
    if (err) return HttpUtil.internalServerError(res, err);
    return HttpUtil.success(res, lists);
  }

  async getListsForGroup(req, res) {
    let requireParams = ['topicId'];
    let params = HttpUtil.getRequiredParams2(req, requireParams);
    let { topicId } = params;
    if (params.error) return HttpUtil.badRequest(res, params.error);
    let [err, ret] = await to(this.service.getTopic(topicId));

    if (err) return HttpUtil.internalServerError(res, err.message || err);
    if (ret && ret.error) return HttpUtil.badRequest(res, ret.error);
    let authUser = req.authUser;
    await this.service.joinTopic(topicId, authUser);
    let options = this.handleFilter(req);
    // options.filter = { 'explore.topics': { $elemMatch: { $eq: topicId } } };
    let lists;
    [err, lists] = await to(
      this.serviceAI.getListsExplore(options, authUser, topicId),
    );

    if (err) return HttpUtil.internalServerError(res, err);
    return HttpUtil.success(res, lists);
  }

  async joinTopic(req, res) {
    let authUser = req.authUser;
    let requireParams = ['topicId'];
    let params = HttpUtil.getRequiredParams2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);
    let { topicId } = params;
    // Check xem topicId tồn tại trong bảng Topics
    let [err, ret] = await to(this.service.getTopic(topicId));
    if (err) return HttpUtil.internalServerError(res, err.message || err);
    if (ret && ret.error) return HttpUtil.badRequest(res, ret.error);

    [err, ret] = await to(this.service.joinTopic(topicId, authUser));
    if (err) return HttpUtil.internalServerError(res, err.message || err);

    return HttpUtil.success(res, ret);
  }

  async outTopic(req, res) {
    let authUser = req.authUser;
    let requireParams = ['topicId'];
    let params = HttpUtil.getRequiredParams2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);
    let { topicId } = params;
    let [err, topic] = await to(this.service.getTopic(topicId));
    if (err) return HttpUtil.internalServerError(res, err.message || err);
    if (topic && topic.error) return HttpUtil.badRequest(res, topic.error);
    let ret;
    [err, ret] = await to(this.service.outTopic(topic, authUser));
    if (err) return HttpUtil.internalServerError(res, err.message || err);
    return HttpUtil.success(res, ret);
  }

  async getUserProfile(req, res) {
    let authUser = req.authUser;
    let requireParams = ['id'];
    let params = HttpUtil.getRequiredParams2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);

    return this.service.getClientProfile(params.id, authUser);
  }
}

module.exports = new Controller();
