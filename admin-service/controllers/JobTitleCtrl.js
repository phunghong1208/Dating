'use strict';

const BaseController = require('./BaseController');
const Model = require('../models/JobTitle');

class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.model = Model;
    this.requireParams = {
      ...this.requireParams,
      store: ['name'],
      update: ['name'],
    };
    this.validate = {
      unique: [
        {
          key: 'name',
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
}

module.exports = new Controller();
