'use strict';

const to = require('await-to-js').default;
const HttpUtil = require('../utils/http');
const BaseController = require('./BaseController');
const User = require('../models/User');

class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.model = User;
  }

  async getProfile(req, res) {
    let authUser = req.authUser;
    if (!authUser || !authUser._id) {
      return HttpUtil.unauthorized(res, 'unauthorized');
    }

    return HttpUtil.success(res, authUser);
  }

  async updateGPS(req, res) {
    let params = HttpUtil.getRequiredParamsFromJson2(req, ['mapAddress']);
    if (params.error) return HttpUtil.badRequest(res, params.error);

    let { mapAddress } = params;
    let authUser = req.authUser;
    let [err, result] = await to(
      this.model.updateOne(authUser._id, { mapAddress }, {}, authUser),
    );
    if (err)
      return HttpUtil.internalServerError(res, {
        msg: 'Errors.update',
        words: err.message,
      });

    return HttpUtil.success(res, 'Success.update');
  }
}

module.exports = new Controller();
