'use strict';

const BaseController = require('./BaseController');
const Model = require('../models/Job');

class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.model = Model;
  }

  async index(req, res) {
    return super.index(req, res);
  }
}

module.exports = new Controller();
