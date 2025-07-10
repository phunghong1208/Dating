'use strict';

const HttpUtil = require('../../../utils/http');
const BaseController = require('../BaseController');
const Service = require('../../cronjob');

class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.service = Service;
  }

  async startJob(req, res) {
    let { apiToken = '' } = req.body;
    let ret = await this.service.start(apiToken);
    return HttpUtil.success(res, ret);
  }

  async stopJob(req, res) {
    let ret = await this.service.stop();
    return HttpUtil.success(res, ret);
  }
}

module.exports = new Controller();
