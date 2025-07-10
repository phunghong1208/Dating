'use strict';

const to = require('await-to-js').default;
const HttpUtil = require('../utils/http');
const BaseController = require('./BaseController');
const User = require('../models/User');
const { roles } = require('../../config');
const RolesNotAllow = [roles.root, roles.admin];

class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.model = User;
    this.includeSoftDeleted = true;
    this.filters = {
      role: { $nin: RolesNotAllow },
      delete: { $exists: true },
      // $or: [
      //   { delete: { $exists: true } },
      //   { disable: true }
      // ]
    };
    this.selection = {
      __v: 0,
      hash: 0,
      salt: 0,
      update: 0,
      insert: 0,
      disable: 0,
      lastPasswordChange: 0,
    };
  }

  async load(req, res, next, id) {
    super.load(req, res, next, id);
  }

  async index(req, res) {
    return super.index(req, res);
  }

  // *** restore account-deleted ***
  async update(req, res) {
    let object = req.object;
    if (!object) return HttpUtil.badRequest(res, 'Not_Founds.Request_Object');

    if (RolesNotAllow.includes(object.role)) {
      return HttpUtil.forbidden(res, 'Permission_Denied');
    }

    let [err, result] = await to(
      this.model.updateOne(
        { _id: object._id },
        { disable: false },
        { delete: '' },
      ),
    );
    if (err)
      return HttpUtil.internalServerError(res, {
        msg: 'Errors.update',
        words: err.message,
      });

    return HttpUtil.success(res, 'Success.restore');
  }

  async destroy(req, res) {
    return super.destroy(req, res);
  }

  async deleteMulti(req, res) {
    return super.deleteMulti(req, res);
  }
}

module.exports = new Controller();
