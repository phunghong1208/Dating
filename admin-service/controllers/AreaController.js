'use strict';

const BaseController = require('./BaseController');
const Model = require('../models/Area');

/*
  Xem hàm mẫu BaseController nếu muốn viết lại các action
*/
class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.model = Model;
    this.requireParams = {
      ...this.requireParams,
      store: ['name'],
      update: ['name'],
    };
    this.acceptFields = {
      store: ['lng', 'lat'],
      update: ['lng', 'lat'],
    };
    this.validate = {
      unique: [
        {
          key: 'name',
          error: 'Found_Errors.area',
          message: 'Unique.area.name',
        },
      ],
      required: [
        {
          key: 'name',
          message: 'Required.area.name',
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
}

module.exports = new Controller();
