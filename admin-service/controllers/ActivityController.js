'use strict';
const to = require('await-to-js').default;
const BaseController = require('./BaseController');
const Model = require('../models/Activity');

class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.model = Model;
    this.lookupType = 'aggregate';
  }

  async index(req, res) {
    return super.index(req, res);
  }

  async getListActivities(req, res) {
    let params = this.getRequiredParams2(req, [
      {
        name: 'actionType',
        dataType: 'number',
        acceptEmpty: false,
      },
      {
        name: 'typeOrder',
        dataType: 'number',
        acceptEmpty: false,
      },
    ]);

    if (params.error) return this.throwBadRequest(res, params.error);
    let options = await this.handleFilter(req);
    let [err, rs] = await to(
      this.model.getListActivitiesByFilter(options, params),
    );
    if (err)
      return this.throwInternalError(res, {
        msg: 'Errors.Load_Lists_Failed',
        words: err.message,
      });
    return this.success(res, { data: rs });
  }
}

module.exports = new Controller();
