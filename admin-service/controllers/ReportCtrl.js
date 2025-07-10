'use strict';

const to = require('await-to-js').default;
const BaseController = require('../controllers/BaseController');
const Model = require('../models/Report');
const Customer = require('../models/Customer');
const ReportAccount = require('../models/ReportAccount');
const HttpUtil = require('../utils/http');
const Utils = require('../utils');

class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.model = Model;
    this.mCustomer = Customer;
    this.mReportAccount = ReportAccount;
    this.lookupType = 'aggregate';
  }

  async index(req, res) {
    return super.index(req, res);
  }

  /**
   * Block account theo ngày
   * @param {*} req
   * @param {*} res
   * @returns
   */
  async blockAccount(req, res) {
    const requireParams = [
      { name: 'interactorId', dataType: 'string' },
      { name: 'lockDuration', dataType: 'number' },
    ];
    let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);
    let authUser = req.authUser;
    let [err, result] = await to(
      this.mCustomer.softBlock({ _id: params.interactorId }, params, authUser),
    );
    if (err)
      return HttpUtil.internalServerError(res, {
        msg: 'Errors.block',
        words: err.message,
      });
    return HttpUtil.success(res, { data: result }, 'Success.Blocks');
  }

  /**
   * Mở khoá account
   * @param {*} req
   * @param {*} res
   * @returns
   */
  async unlockAccount(req, res) {
    const requireParams = [{ name: 'interactorId', dataType: 'string' }];
    let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);
    let authUser = req.authUser;
    await this.mCustomer.updateManyArray(
      {
        _id: { $in: [params.interactorId] },
      },
      { $unset: { block: '' } },
    );
    let [err, result] = await to(
      this.mCustomer.softUnlock({ _id: params.interactorId }, authUser),
    );
    if (err)
      return HttpUtil.internalServerError(res, {
        msg: 'Errors.unlock',
        words: err.message,
      });
    return HttpUtil.success(res, 'Success.Unlock');
  }

  async getListReportAccount(req, res) {
    let params = this.getRequiredParams2(req, []);
    if (params.error) return this.throwBadRequest(res, params.error);

    let options = await this.handleFilterCared(req);
    let [err, lists] = await to(
      this.mReportAccount.getCardReportAccount(options, params),
    );
    if (err) return this.throwInternalError(res, msg.error || err);
    return this.success(res, { data: lists });
  }
}

module.exports = new Controller();
