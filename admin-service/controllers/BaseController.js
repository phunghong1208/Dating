'use strict';

const to = require('await-to-js').default;
const Utils = require('../utils/index');
const DBUtil = require('../utils/Database');
const HttpUtil = require('../utils/http');

class BaseController {
  constructor(child) {
    this.selection = null;
    this.softDelete = false;
    this.includeSoftDeleted = false;
    this.lookupType = 'popupate'; // lookup: popupate or aggregate
    this.filters = {};
    this.requireParams = {
      store: [],
      update: [],
      delete: [{ name: 'ids', dataType: 'array' }],
    };
    this.acceptFields = {
      store: [],
      update: [],
    };
    this.validate = {
      unique: [],
    };
    this.bindingMethods = this.bindingMethods.bind(this);
    this.bindingMethods(child);
  }

  async load(req, res, next, id) {
    let [err, object] = await to(
      this.model.getById(id, { includeSoftDeleted: this.includeSoftDeleted }),
    );
    if (err)
      return this.throwBadRequest(res, {
        msg: 'Errors.Load_Detail_Failed',
        words: err.message,
      });

    if (!object)
      return this.throwUnprocessable(res, {
        msg: 'Not_Exists.general',
        words: id,
      });

    req.object = object;
    next();
  }

  async handleFilterCared(req) {
    let { currentPage, pageSize, filters, sorting } = req.query;
    currentPage = currentPage ? parseInt(currentPage) : 0;
    pageSize = pageSize ? parseInt(pageSize) : 0;
    if (pageSize < 0) pageSize = -1;
    if (currentPage < 0) currentPage = 0;
    return { pageSize, currentPage, sorts: sorting };
  }

  async handleFilter(req) {
    let { currentPage, pageSize, filters, sorting } = req.query;
    currentPage = currentPage ? parseInt(currentPage) : 0;
    pageSize = pageSize ? parseInt(pageSize) : 500;

    let options = {
      pageSize,
      currentPage,
      filters: { ...this.filters },
      sorts: null,
    };
    if (filters && Utils.isArray(filters) && filters.length) {
      let relations = this.model.getRelationInfo();
      let lookupInfos = this.model.getRelationKeys();
      options = DBUtil.setFilters(options, filters, lookupInfos);
      if (lookupInfos.length && !Utils.isObjectEmpty(options.conditions)) {
        let conditions = options.conditions;
        for (let key in conditions) {
          let filterKey = key;
          let condition = conditions[key];
          let modelName = Utils.getModelName(key);
          if (relations[key]) {
            modelName = relations[key].ref;
            filterKey = relations[key].localField;
          }
          // load relation models
          let ModelRelation = require(`../models/${modelName}`);
          // let ModelRelation = this.model.connection.models[modelName];
          if (ModelRelation) {
            let [err, ids] = await to(
              ModelRelation.getIdsByCondition(condition),
            );
            if (err) {
              let msg = `BaseController.index --- setFilters '${key}' failed: ${err.message}`;
              throw Error(msg);
            }
            options.filters[filterKey] = { $in: ids };
          }
        }
      }
    }
    if (sorting && Utils.isArray(sorting) && sorting.length) {
      options = DBUtil.setSortConditions(options, sorting);
    }
    return options;
  }

  async index(req, res) {
    if (req.query.queryFilters) {
      let { queryFilters, ...conditions } = req.query;
      return this.queryFilters(res, conditions, true);
    }
    let options = await this.handleFilter(req);
    let fn = this.lookupType == 'aggregate' ? 'aggregateToLists' : 'lists';
    if (options.pageSize < 1 || options.currentPage < 0) {
      // get all data
      let [err, rs] = await to(this.model[fn](options));
      if (err)
        return HttpUtil.internalServerError(res, {
          msg: 'Errors.Load_Lists_Failed',
          words: err.message,
        });
      return HttpUtil.success(res, rs);
    }
    let [err, rs] = await to(
      Promise.all([
        this.model[fn](options, this.selection),
        this.model.getCount(options.filters),
      ]),
    );
    if (err)
      return HttpUtil.internalServerError(res, {
        msg: 'Errors.Load_Lists_Failed',
        words: err.message,
      });
    rs = DBUtil.paginationResult(rs[0], rs[1], options, req.query);
    return HttpUtil.success(res, rs);
  }

  detail(req, res) {
    let object = req.object;
    if (!object) return HttpUtil.badRequest(res, 'Not_Founds.Request_Object');

    return HttpUtil.success(res, Utils.cloneObject(object));
  }

  async store(req, res) {
    let params;
    if (this.requireParams.store.length) {
      params = HttpUtil.getRequiredParamsFromJson2(
        req,
        this.requireParams.store,
      );
      if (params.error) return HttpUtil.badRequest(res, params.error);
      params = Utils.getAcceptableFields(params, [
        ...this.requireParams.store,
        ...this.acceptFields.store,
      ]);
    } else {
      params = req.body;
    }

    let err, msg;
    if (this.validate.unique.length) {
      for (let i = 0; i < this.validate.unique.length; i++) {
        let item = this.validate.unique[i];
        if (params[item.key]) {
          [err, msg] = await to(this.validateUnique(item, params));
          if (err) return HttpUtil.internalServerError(res, err.message);
          if (msg !== true) return HttpUtil.unprocessable(res, msg);
        }
      }
    }
    // validate value input, validate unique, permission ...
    let result;
    [err, result] = await to(this.model.insertOne(params, req.authUser));
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

    let params;
    if (this.requireParams.update.length) {
      params = HttpUtil.getRequiredParamsFromJson2(
        req,
        this.requireParams.update,
      );
      if (params.error) return HttpUtil.badRequest(res, params.error);
      params = Utils.getAcceptableFields(params, [
        ...this.requireParams.update,
        ...this.acceptFields.update,
      ]);
    } else {
      params = req.body;
    }

    let err, msg;
    if (this.validate.unique.length) {
      for (let i = 0; i < this.validate.unique.length; i++) {
        let item = this.validate.unique[i];
        if (
          params[item.key] &&
          object[item.key] &&
          params[item.key] !== object[item.key]
        ) {
          [err, msg] = await to(this.validateUnique(item, params));
          if (err) return HttpUtil.internalServerError(res, err.message);
          if (msg !== true) return HttpUtil.unprocessable(res, msg);
        }
      }
    }

    delete params._id; // not update _id
    // validate value input, validate unique, permission ...
    let result;
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
    let object = req.object;
    if (!object) return HttpUtil.badRequest(res, 'Not_Founds.Request_Object');

    let err, result;
    let condition = { _id: object._id };
    if (!this.softDelete) {
      // [err, result] = await to(this.model.deleteById(object._id))
      [err, result] = await to(this.model.deleteOne(condition));
    } else {
      [err, result] = await to(this.model.softDeletes(condition, req.authUser));
    }
    if (err)
      return HttpUtil.internalServerError(res, {
        msg: 'Errors.delete',
        words: err.message,
      });

    return HttpUtil.success(res, 'Success.delete');
  }

  async deleteMulti(req, res) {
    let params = HttpUtil.getRequiredParamsFromJson2(
      req,
      this.requireParams.delete,
    );
    if (params.error) return HttpUtil.badRequest(res, params.error);

    params = Utils.getAcceptableFields(params, this.requireParams.delete);
    let condition = { _id: { $in: params.ids } };
    let err, result;
    if (!this.softDelete) {
      [err, result] = await to(this.model.deleteOne(condition));
    } else {
      [err, result] = await to(
        this.model.softDeletes(condition, req.authUser, true),
      );
    }
    if (err)
      return HttpUtil.internalServerError(res, {
        msg: 'Errors.delete',
        words: err.message,
      });

    return HttpUtil.success(res, 'Success.delete');
  }

  async queryFilters(res, conditions, lookup = false) {
    let [err, result] = await to(this.model.find(conditions, { lookup }));
    if (err) return HttpUtil.internalServerError(res, err);

    return HttpUtil.success(res, result);
  }

  async validateUnique(item, params) {
    let condition = {};
    condition[item.key] = params[item.key];
    let [err, exist] = await to(this.model.getOne(condition));
    if (err) throw Error(Utils.localizedText(item.err, item.message));
    if (exist) return Utils.localizedText(item.message, params[item.key]);
    return true;
  }

  bindingMethods(obj) {
    let methods = Object.getOwnPropertyNames(obj.prototype);
    methods = methods.filter(
      x =>
        x !== 'constructor' && x !== 'bindingMethods' && x !== 'validateUnique',
    );

    for (let method of methods) {
      this[method] = this[method].bind(this);
    }
  }

  throwErr(err, code) {
    throw Error(err.message || err);
  }

  throwBadRequest(res, err) {
    return HttpUtil.badRequest(res, err?.message || err);
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

  getRequiredParams2(req, requiredParams) {
    return HttpUtil.getRequiredParams2(req, requiredParams);
  }
}

module.exports = BaseController;
