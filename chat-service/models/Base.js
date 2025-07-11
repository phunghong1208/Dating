'use strict';

const mongoose = require('mongoose');
const to = require('await-to-js').default;
const Utils = require('../utils');
const DBUtils = require('../utils/Database');

const { NODE_ENV = 'production', DB_LOCALE = 'vi' } = process.env;
const schemaOptions = {
  autoIndex: NODE_ENV !== 'production',
  collation: {
    locale: DB_LOCALE,
    numericOrdering: true,
    strength: 1,
  },
  toJSON: { virtuals: true },
  id: false,
};

class BaseModel {
  constructor(modelName, fields) {
    this.modelName = modelName;
    this.relations = [];
    this.allowFields = [];
    this.projection = { delete: 0, __v: 0 };
    this.init(fields);
  }

  init(fields) {
    let schema = new mongoose.Schema(fields, schemaOptions);
    if (this.relations.length) {
      this.relations.map(item => {
        let { path, ref, localField } = item;
        schema.virtual(path, {
          ref,
          localField,
          foreignField: '_id',
          justOne: true,
        });
      });
    }
    this._model = mongoose.model(this.modelName, schema);
  }

  get collection() {
    return this._model.collection;
  }

  get connection() {
    return this._model.collection.conn;
  }

  getFields(record, fields = null) {
    if (!fields) fields = this.allowFields;
    return Utils.fillOptionalFields(record, {}, fields);
  }

  // return lookup or populate info
  getRelations() {
    return [...this.relations];
  }
  // return lookup or populate key
  getRelationKeys() {
    return this.relations.map(item => item.path);
  }
  // return lookup or populate key and ref
  getRelationInfo() {
    let rs = {};
    this.relations.map(item => {
      let { path, ref, localField } = item;
      rs[path] = { ref, localField };
    });
    return rs;
  }

  /**
   * Get record by _id
   * @param {string} _id // Ulid
   * @param {any} options: {includeSoftDeleted: false, lookup: false}
   */
  async getById(_id, options = null) {
    options = options || {};
    const cond = options.includeSoftDeleted
      ? { _id }
      : DBUtils.excludeSoftDelete({ _id });
    const projection = options.projection || this.projection;
    let query = this._model.findOne(cond, projection);
    if (options.lookup && this.relations.length) {
      this.relations.map(item => {
        query.populate(item);
      });
    }
    const [err, result] = await to(query);
    if (err) throw Error(err.message);
    return result ? Utils.cloneObject(result) : result;
  }

  async getByIds(ids) {
    return this.find({ _id: { $in: ids } });
  }

  async getByIdsCode(ids) {
    return this.getOne({ code: { $in: ids } });
  }
  async getByIdsUserId(ids) {
    return this.getOne({ userId: { $in: ids } });
  }

  async getByUserId(condition) {
    console.log('condition', condition);
    let list = this.find(condition);
    return list;
  }

  async getListByUserId(ids) {
    let list = this.find({ userId: { $in: ids } });
    return list;
  }

  /**
   * Get record by _id
   * @param {string} id // ulid
   * DEPRECATED
   */
  /* async load(id, lookup = false) {
    const cond = DBUtils.excludeSoftDelete({ _id: id });
    let query = this._model.findOne(cond, this.projection);
    if (lookup && this.relations.length) {
      this.relations.map(item => {
        query.populate(item)
      })
    }
    const [err, result] = await to(query);
    if (err) throw Error(err.message);
    return result ? Utils.cloneObject(result) : result
  } */

  async getOne(condition, options = null) {
    options = options || {};
    const selection = options.projection || this.projection;
    const { lookup = false, raw = false } = options;
    let query = this._model.findOne(
      DBUtils.excludeSoftDelete(condition),
      selection,
    );
    if (lookup && this.relations.length) {
      this.relations.map(item => {
        query.populate(item);
      });
    }
    let [err, result] = await to(query);
    if (err) throw Error(err.message);
    if (raw) return result;
    return result ? Utils.cloneObject(result) : result;
  }

  async find(condition, options = null) {
    options = options || {};
    const selection = options.projection || this.projection;
    const { pageSize = 0, currentPage = 0, sorts, lookup = false } = options;
    let query = this._model.find(DBUtils.excludeSoftDelete(condition));
    if (lookup && this.relations.length) {
      this.relations.map(item => {
        query.populate(item);
      });
    }
    //query.select(selection);
    if (sorts) query.sort(sorts);
    if (pageSize > 0) {
      query.limit(pageSize);
      query.skip(currentPage * pageSize);
    }
    return await query;
  }

  async getIdsByCondition(condition) {
    let [err, lists] = await to(this.find(condition));
    if (err) throw Error(err.message);
    return lists.length ? lists.map(item => item._id) : [];
  }

  /**
   * get list
   * @param {Object} options
   * @param {Object} selection
   * @api private
   */

  async lists(options, selection = null) {
    if (!selection) selection = this.projection;
    let sorts = options.sorts || { 'insert.when': -1 }; // default sort by createdAt
    let query = this._model.find(DBUtils.excludeSoftDelete(options.filters));
    if (this.relations.length) {
      this.relations.map(item => query.populate(item));
    }
    query = query.select(selection).sort(sorts);
    // console.log("------------ query", query)
    if (options.currentPage < 0 || options.pageSize < 1) return await query; // get all data set options.page = -1
    return await query
      .limit(options.pageSize)
      .skip(options.currentPage * options.pageSize);
  }

  async aggregateToLists(options, selection = null) {
    if (!selection) selection = { ...this.projection };
    let sorts = options.sorts || { 'insert.when': -1 }; // default sort by createdAt
    let pipeline = [{ $match: DBUtils.excludeSoftDelete(options.filters) }];
    if (sorts) pipeline.push({ $sort: sorts });
    if (options.currentPage >= 0 && options.pageSize > 0) {
      // get all data set options.page = -1
      // skip: from, limit: to
      let skip = options.pageSize * options.currentPage;
      let limit = options.pageSize * (options.currentPage + 1);
      pipeline = pipeline.concat([{ $limit: limit }, { $skip: skip }]);
    }
    if (this.relations.length) {
      this.relations.map(item => {
        let ModelRelation = this.connection.models[item.ref];
        if (ModelRelation) {
          let collectionName = ModelRelation.collection.collectionName;
          pipeline = pipeline.concat([
            {
              $lookup: {
                from: collectionName,
                localField: item.localField,
                foreignField: '_id',
                as: item.path,
              },
            },
            {
              $unwind: {
                path: `$${item.path}`,
                preserveNullAndEmptyArrays: true,
              },
            },
          ]);
          // update project key for lookup data
          delete selection[item.path]; // remove key
          let allowFields = item.select.split(' ');
          allowFields.map(key => {
            selection[`${item.path}.${key}`] = 1; // add key
          });
        }
      });
    }
    pipeline.push({ $project: selection });
    // console.log("------------ aggregateToLists pipeline", JSON.stringify(pipeline));
    return this.execAggregate(pipeline);
  }

  async execAggregate(pipeline) {
    return await this._model.aggregate(pipeline).allowDiskUse(true).exec();
  }

  async getCountWithAggregate(pipeline) {
    let rs = await this.execAggregate(pipeline);
    if (rs.length === 0) {
      return 0;
    }
    return rs[0].total;
  }

  async getCount(condition) {
    condition = DBUtils.excludeSoftDelete(condition);
    return this._model.countDocuments(condition); // version mongoose 5.8.3
  }

  async insertOne(obj, authUser = null) {
    obj.insert = {
      when: Date.now(),
      by: authUser ? authUser._id : undefined,
    };
    // add ulid
    const ulid = Utils.generateULID();
    if (!obj._id) obj._id = ulid;
    // obj.id = ulid;
    return this._model.create(obj);
  }

  async insertMulti(arr, authUser = null) {
    for (let i = 0; i < arr.length; i++) {
      const ulid = Utils.generateULID();
      arr[i]._id = ulid;
      // arr[i].id = ulid;
    }
    return this._model.create(arr);
  }
  async insertObject(obj, authUser = null) {
    const ulid = Utils.generateULID();
    obj._id = ulid;
    // arr[i].id = ulid;

    return this._model.create(obj);
  }

  setUpdateInfo(dataSet, dataUnset, authUser = null) {
    dataSet = dataSet || {};
    dataSet.update = {
      when: Date.now(),
      by: authUser ? authUser._id : undefined,
    };
    let data = { $set: dataSet };
    if (dataUnset && Object.keys(dataUnset).length) data['$unset'] = dataUnset;
    return data;
  }

  async updateOne(_id, dataSet, dataUnset = {}, authUser = null) {
    console.log('dataSet', dataSet);
    let updateInfo = this.setUpdateInfo(dataSet, dataUnset, authUser);
    return this._model.updateOne({ _id }, updateInfo);
  }

  async updateManyByCond(condition, dataSet, dataUnset = {}, authUser = null) {
    let updateInfo = this.setUpdateInfo(dataSet, dataUnset, authUser);
    return this.updateMany(condition, updateInfo);
  }

  async updateOneData(condition, updateInfo) {
    return this._model.updateOne(condition, updateInfo);
  }

  async updateManyArray(condition, data) {
    return this._model.updateMany(condition, data);
  }

  async findOneAndUpdate(condition, data, options, authUser = null) {
    data = data || {};
    data.update = {
      when: Date.now(),
      by: authUser ? authUser._id : undefined,
    };
    return this._model.findOneAndUpdate(condition, data, options);
  }

  async updateItem(condition, data, options = {}, authUser = null) {
    data = data || {};
    data.update = {
      when: Date.now(),
      by: authUser ? authUser._id : undefined,
    };
    return this._model.updateOne(condition, data, options);
  }

  async replaceItem(_id, data, authUser = null) {
    if (authUser) {
      data.update = {
        when: Date.now(),
        by: authUser._id,
      };
    }

    console.log('data', data);
    return this._model.replaceOne({ _id }, data);
  }

  async deleteOne(condition) {
    return this._model.deleteOne(condition); // version mongoose 5.8.3
  }

  async deleteMany(condition) {
    return this._model.deleteMany(condition);
  }

  async deleteById(_id) {
    return this.deleteOne({ _id });
  }

  async deleteByIds(ids) {
    return this.deleteMany({ _id: { $in: ids } });
  }

  async softDeletes(condition, authUser = null, multi = false) {
    let data = {
      when: Date.now(),
      by: authUser ? authUser._id : undefined,
    };
    let updateInfo = { $set: { delete: data } };
    return this._model.update(condition, updateInfo, { multi });
    // if (multi) return this._model.updateMany(condition, updateInfo);
    // return await this._model.updateOne(condition, updateInfo);
  }

  async softBlock(condition, params, authUser = null, multi = false) {
    let now = Date.now();
    let unlockTime = now + params.lockDuration * 24 * 60 * 60 * 1000;

    console.log('condition', condition);
    let data = {
      when: unlockTime,
      by: authUser ? authUser._id : undefined,
    };
    let updateInfo = {
      $set: { block: data, disable: params.disable },
      $unset: { unlock: '' },
    };
    return this._model.update(condition, updateInfo, { multi });
  }

  async softUnlock(condition, authUser = null, multi = false) {
    let data = {
      when: Date.now(),
      by: authUser ? authUser._id : undefined,
    };
    let updateInfo = { $set: { unlock: data, disable: false } };
    return this._model.update(condition, updateInfo, { multi });
  }

  async buildMapObjects(ids) {
    let lists = await this.find({ _id: { $in: ids } });
    let map = {};
    if (lists && lists.length) {
      lists.map(item => {
        map[item._id] = item;
      });
    }
    return map;
  }
}

module.exports = BaseModel;
