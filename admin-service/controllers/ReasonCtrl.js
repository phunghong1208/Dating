'use strict';

const to = require('await-to-js').default;
const BaseController = require('./BaseController');
const Model = require('../models/Reason');
const ReasonAccount = require('../models/ReasonAccount');

/*
  Xem hàm mẫu BaseController nếu muốn viết lại các action
*/
class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.model = Model;
    this.mReasonAccount = ReasonAccount;
    this.requireParams = {
      ...this.requireParams,
      store: [
        'reason',
        { name: 'details', dataType: 'array', acceptEmpty: true },
      ],
      update: [
        'reason',
        { name: 'details', dataType: 'array', acceptEmpty: true },
      ],
    };
    this.validate = {
      unique: [
        {
          key: 'reason',
          error: 'Found_Errors.general',
          message: 'Exists.general',
        },
      ],
    };
  }

  async load(req, res, next, id) {
    return super.load(req, res, next, id);
  }

  async index(req, res) {
    return super.index(req, res);
  }

  detail(req, res) {
    return super.detail(req, res);
  }

  async store(req, res) {
    return super.store(req, res);
  }

  async update(req, res) {
    return super.update(req, res);
  }

  async destroy(req, res) {
    return super.destroy(req, res);
  }

  async deleteMulti(req, res) {
    return super.deleteMulti(req, res);
  }

  async getListReasonAccount(req, res) {
    let { language = 'en' } = req.headers;
    let [err, data] = await to(
      this.mReasonAccount.getReasonInformation(language),
    );
    if (err) return HttpUtil.unprocessable(res, err);
    return HttpUtil.success(res, data);
  }
}

module.exports = new Controller();
