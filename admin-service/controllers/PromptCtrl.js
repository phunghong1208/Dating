'use strict';

const BaseController = require('./BaseController');
const to = require('await-to-js').default;
const HttpUtil = require('../../utils/http');
const Model = require('../models/Prompt');
const { forEach } = require('lodash');

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
      store: ['category'],
      update: ['category'],
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



  /**
   * Update category in prompt
   * @param {*} req 
   * @param {*} res 
   * @returns 
   * Create By: Nvduc
   */
  async updateCategory(req, res) {
    let newAray = req.body;

    newAray.listPromtpt.forEach(async element => {
      // console.log(element);
      let result = await this.model.getByIdsCode(element);

      let resultUpdate = await this.model.updateOne(result._id, {
        codeCategory: newAray.codeCategory,
      });
    });

    return HttpUtil.success(res, 'Add success');
  }
}

module.exports = new Controller();
