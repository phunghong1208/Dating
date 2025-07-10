'use strict';

const to = require('await-to-js').default;
const AuthUtil = require('../utils/auth');
const Utils = require('../utils');
const BaseController = require('../../Base');
const User = require('../models/User');
const { roles, passwordDefault } = require('../../config');

class AuthController extends BaseController {
  constructor() {
    super(AuthController);
    this.model = User;
  }

  async register(req, res) {
    const requireParams = ['email', 'name', 'password']; // password phải được đặt cuối cùng.
    let params = this.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return this.throwBadRequest(res, params.error);

    const { email, name, password } = params;
    let [err, user] = await to(this.model.getOne({ email: email }));
    if (err) {
      return this.throwInternalError(res, {
        msg: 'Found_Errors.user',
        words: err.message,
      });
    }
    if (user) {
      return this.throwUnprocessable(res, {
        msg: 'Unique.user.email',
        words: params.email,
      });
    }

    let { salt, hash } = AuthUtil.setPassword(password);
    let obj = { email, name, role: roles.admin, salt, hash };
    [err, user] = await to(this.model.insertOne(obj));
    if (err) {
      return this.throwInternalError(res, {
        msg: 'Errors.register',
        words: err.message,
      });
    }

    user = Utils.cloneObject(user);
    user = User.getFields(user);
    const token = AuthUtil.generateJwt(user);

    return this.success(res, {
      data: { token: token, user },
      message: 'Success.register',
    });
  }

  async login(req, res) {
    const requireParams = ['username', 'password'];
    let params = this.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return this.throwBadRequest(res, params.error);

    let { username, password } = params;
    let condition = { $or: [{ email: username }, { username: username }] };

    let [err, user] = await to(this.model.getDetailForAuth(condition, true));
    if (err) return this.throwUnauthorized(res, err);
    if (!user || user.delete) {
      return this.throwUnprocessable(res, {
        msg: 'Not_Exists.user',
        words: username,
      });
    }
    if (user.disable) {
      return this.throwUnprocessable(res, 'Disable_Login');
    }
    if (!AuthUtil.validPassword(user, password)) {
      return this.throwBadRequest(res, 'Errors.Incorrect_Password');
    }

    let token = AuthUtil.generateJwt(user);
    ['hash', 'salt', '__v', 'update', 'insert'].forEach(
      field => delete user[field],
    );

    return this.success(res, {
      data: { token, user },
      message: 'Success.login',
    });
  }

  async logout(req, res) {
    return this.success(res, 'Success.general');
  }

  async changePassword(req, res) {
    const requireParams = ['old_password', 'new_password', 'retype_password'];
    let params = this.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return this.throwBadRequest(res, params.error);
    if (!Utils.compareString(params.new_password, params.retype_password)) {
      return this.throwBadRequest(res, 'Errors.Pw_Not_Match');
    }
    if (Utils.compareString(params.old_password, params.new_password)) {
      return this.throwBadRequest(res, 'Errors.New_Old_Pw_Must_Different');
    }

    let object = req.authUser;
    if (!object || !object._id)
      return this.throwUnauthorized(res, 'unauthorized');

    let err, user;
    [err, user] = await to(this.model.getDetailForAuth({ _id: object._id }));
    if (err) {
      return this.throwInternalError(res, {
        msg: 'Found_Errors.user',
        words: err.message,
      });
    }
    if (!user || user.delete) {
      return this.throwUnprocessable(res, {
        msg: 'Not_Exists.user',
        words: object._id,
      });
    }
    if (!AuthUtil.validPassword(user, params.old_password)) {
      return this.throwUnprocessable(res, 'Errors.Old_Pw_Not_Match');
    }

    let objUpdate = AuthUtil.setPassword(params.new_password);
    objUpdate.lastPasswordChange = Date.now();
    [err, user] = await to(this.model.updateOne(user._id, objUpdate));
    if (err)
      return this.throwInternalError(res, {
        msg: 'Errors.Change_Password',
        words: err.message,
      });

    return this.success(res, 'Success.Change_Password');
  }

  async resetPassword(req, res) {
    let err, user;
    let authUser = req.authUser;
    if ([roles.root, roles.admin].indexOf(authUser.role) === -1) {
      return this.throwPermissionDenied(res, 'Permission_Denied');
    }

    const requireParams = ['userId', 'new_password', 'retype_password'];
    let params = this.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return this.throwBadRequest(res, params.error);
    if (!Utils.compareString(params.new_password, params.retype_password)) {
      return this.throwBadRequest(res, 'Errors.Pw_Not_Match');
    }

    [err, user] = await to(this.model.getDetailForAuth({ _id: params.userId }));
    if (err) {
      return this.throwInternalError(res, {
        msg: 'Found_Errors.user',
        words: err.message,
      });
    }
    if (!user || user.delete) {
      return this.throwUnprocessable(res, {
        msg: 'Not_Exists.user',
        words: params.userId,
      });
    }
    if (user.role === roles.admin && authUser.role !== roles.root) {
      return this.throwPermissionDenied(res, 'Permission_Denied');
    }

    let objUpdate = AuthUtil.setPassword(params.new_password);
    objUpdate.lastPasswordChange = Date.now();
    [err, user] = await to(this.model.updateOne(user._id, objUpdate));
    if (err) return this.throwInternalError(res, 'Errors.Reset_Password');

    return this.success(res, 'Success.Reset_Password');
  }

  async resetDefaultPassword(req, res) {
    return this.handleAcc(req, res);
  }

  async lockAccount(req, res) {
    return this.handleAcc(req, res, { action: 'lock' });
  }

  async unlockAccount(req, res) {
    return this.handleAcc(req, res, { action: 'unlock', disable: false });
  }

  async handleAcc(req, res, options = {}) {
    let params = this.checkRequiredParams2(req.params, ['userId']);
    if (params.error) return this.throwBadRequest(res, params.error);

    let authUser = req.authUser;
    if ([roles.root, roles.admin].indexOf(authUser.role) === -1) {
      return this.throwPermissionDenied(res, 'Permission_Denied');
    }

    let [err, user] = await to(
      this.model.getDetailForAuth({ _id: params.userId }),
    );
    if (err) {
      return this.throwInternalError(res, {
        msg: 'Found_Errors.user',
        words: err.message,
      });
    }
    if (!user || user.delete) {
      return this.throwUnprocessable(res, {
        msg: 'Not_Exists.user',
        words: params.userId,
      });
    }
    if (user.role === roles.admin && authUser.role !== roles.root) {
      return this.throwPermissionDenied(res, 'Permission_Denied');
    }

    let { action = 'reset_pwd', disable = true } = options;
    let msg = {},
      objUpdate = { disable: disable };
    if (action === 'reset_pwd') {
      msg = {
        error: 'Errors.Reset_Password',
        success: 'Success.Reset_Password',
      };
      objUpdate = AuthUtil.setPassword(passwordDefault);
      objUpdate.lastPasswordChange = Date.now();
    }

    [err, user] = await to(this.model.updateOne(user._id, objUpdate));
    if (err) return this.throwInternalError(res, msg.error || err);

    return this.success(res, msg.success || 'Success.general');
  }
}

module.exports = new AuthController();
