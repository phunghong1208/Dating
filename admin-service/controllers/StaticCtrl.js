'use strict';

const BaseController = require('./BaseController');
/*
  Xem hàm mẫu BaseController nếu muốn viết lại các action
*/
class Controller extends BaseController {
  constructor(modelName) {
    super(Controller);
    this.model = require(`../models/${modelName}`);
    this.requireParams = {
      ...this.requireParams,
      store: ['code', 'langs.en', 'langs.vi'],
      update: ['code', 'langs.en', 'langs.vi'],
    };
    this.acceptFields = {
      store: ['langs.ja'],
      update: ['langs.ja'],
    };
    this.validate = {
      unique: [
        {
          key: 'code',
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
}

module.exports = Controller;
