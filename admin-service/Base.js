'use strict';

const Utils = require('./utils');
const HttpUtil = require('./utils/http');

class Base {
  constructor(child) {
    this.bindingMethods = this.bindingMethods.bind(this);
    this.bindingMethods(child);
  }

  bindingMethods(obj) {
    let methods = Object.getOwnPropertyNames(obj.prototype);
    methods = methods.filter(
      x => x !== 'constructor' && x !== 'bindingMethods',
    );
    for (let method of methods) {
      this[method] = this[method].bind(this);
    }
  }

  throwErr(err, code) {
    throw Error(err.message || err);
  }

  handleFilter(req) {
    let { currentPage, pageSize, filters, sorting } = req.query;
    currentPage = currentPage ? parseInt(currentPage) : 0;
    pageSize = pageSize ? parseInt(pageSize) : 0;
    if (pageSize < 0) pageSize = -1;
    if (currentPage < 0) currentPage = 0;
    return { pageSize, currentPage, sorts: sorting };
  }

  getCreateBy(authUser) {
    return Utils.getCreateBy(authUser);
  }

  throwUnauthorized(res, err) {
    return HttpUtil.unauthorized(res, err.message || err);
  }

  throwPermissionDenied(res, err) {
    return HttpUtil.forbidden(res, err.message || err);
  }

  throwBadRequest(res, err) {
    return HttpUtil.badRequest(res, err.message || err);
  }

  throwInternalError(res, err) {
    return HttpUtil.internalServerError(res, err.message || err);
  }

  throwUnprocessable(res, err) {
    return HttpUtil.unprocessable(res, err.message || err);
  }

  success(res, data) {
    if (Utils.isString(data)) data = { message: data };
    return HttpUtil.success(res, data.data, data.message);
  }

  checkRequiredParams2(input, requiredParams) {
    return HttpUtil.checkRequiredParams2(input, requiredParams);
  }

  getRequiredParamsFromJson2(input, requiredParams) {
    return HttpUtil.getRequiredParamsFromJson2(input, requiredParams);
  }
}

module.exports = Base;
