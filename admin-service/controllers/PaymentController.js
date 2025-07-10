'use strict';

const BaseController = require('./BaseController');
const Model = require('../models/Payment');

class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.model = Model;
    this.lookupType = 'aggregate';
  }

  async index(req, res) {
    return super.index(req, res);
  }
}

module.exports = new Controller();
