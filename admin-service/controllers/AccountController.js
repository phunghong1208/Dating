'use strict';

const to = require('await-to-js').default;
const AuthUtil = require('../utils/auth');
const HttpUtil = require('../utils/http');
const Utils = require('../utils/index');
const BaseController = require('./BaseController');
const Model = require('../models/User');
const { roles } = require('../config');

/*
  Quản lý tài khoản admin
 */
class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.model = Model;
    this.requireParams = {
      ...this.requireParams,
      store: ['email', 'name', 'phone', 'password', 'confirmPassword'],
      update: ['email', 'name', 'phone'],
    };
    this.acceptFields = {
      store: ['address', 'description'],
      update: ['address', 'description'],
    };
    this.filters = { role: roles.admin };
    this.validate = {
      unique: [
        {
          key: 'email',
          error: 'Found_Errors.user',
          message: 'Exists.email',
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
    let params = HttpUtil.getRequiredParamsFromJson2(
      req,
      this.requireParams.store,
    );
    if (params.error) return HttpUtil.badRequest(res, params.error);

    if (!Utils.compareString(params.password, params.confirmPassword)) {
      return HttpUtil.badRequest(res, 'Errors.Pw_Not_Match');
    }

    params = Utils.getAcceptableFields(params, [
      ...this.requireParams.store,
      ...this.acceptFields.store,
    ]);
    let err, result;
    let condition = { email: params.email };
    [err, result] = await to(this.model.getOne(condition));
    if (err)
      return HttpUtil.internalServerError(res, {
        msg: 'Found_Errors.user',
        words: err.message,
      });
    if (result)
      return HttpUtil.unprocessable(res, {
        msg: 'Unique.user.email',
        words: params.email,
      });

    let password = AuthUtil.setPassword(params.password);
    delete params.password;
    delete params.confirmPassword;

    params = {
      ...params,
      ...password,
      role: roles.admin,
    };

    [err, result] = await to(this.model.insertOne(params), req.authUser);
    if (err)
      return HttpUtil.internalServerError(res, {
        msg: 'Errors.create',
        words: err.message,
      });
    delete result.__v; // not copy version;

    return HttpUtil.success(res, result, 'Success.create');
  }

  async update(req, res) {
    let object = req.object;
    if (!object) return HttpUtil.badRequest(res, 'Not_Founds.Request_Object');

    let params = HttpUtil.getRequiredParamsFromJson2(
      req,
      this.requireParams.update,
    );
    if (params.error) return HttpUtil.badRequest(res, params.error);

    params = Utils.getAcceptableFields(params, [
      ...this.requireParams.update,
      ...this.acceptFields.update,
    ]);
    let err, result;
    if (params.email !== object.email) {
      [err, result] = await to(this.model.getOne({ email: params.email }));
      if (err)
        return HttpUtil.internalServerError(res, {
          msg: 'Found_Errors.user',
          words: err.message,
        });
      if (result)
        return HttpUtil.unprocessable(res, {
          msg: 'Unique.user.email',
          words: params.email,
        });
    }
    // validate value input, validate unique, permission ...
    [err, result] = await to(
      this.model.updateOne(object._id, params, {}, req.authUser),
    );
    if (err)
      return HttpUtil.internalServerError(res, {
        msg: 'Errors.update',
        words: err.message,
      });

    return HttpUtil.success(res, 'Success.update');
  }

  async destroy(req, res) {
    return super.destroy(req, res);
  }

  async deleteMulti(req, res) {
    return super.deleteMulti(req, res);
  }
}

module.exports = new Controller();
