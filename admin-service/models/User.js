'use strict';
/**
 * @description Schema of User.
 */
const BaseModel = require('../models/Base');
const Entities = require('../../shared-entities');
const Utils = require('../../utils');

class User extends BaseModel {
  constructor() {
    super('User', Entities.users);
    this.projection = { delete: 0, __v: 0, hash: 0, salt: 0 };
    this.allowFields = [
      '_id',
      'email',
      'name',
      'role',
      'phone',
      'insert',
      'update',
    ];
  }

  getProfiles(record, fields = null) {
    if (!fields) fields = [...this.allowFields];
    fields = fields.filter(el => el !== 'insert' && el !== 'update');
    return Utils.fillOptionalFields(record, {}, fields);
  }

  async buildMapUsers(userIds) {
    const projection = { name: 1, email: 1, phone: 1, address: 1 };
    let lists = await this.find({ _id: { $in: userIds } }, { projection });
    let map = {};
    if (lists && lists.length) {
      lists.map(user => {
        map[user._id] = user;
      });
    }
    return map;
  }

  async getDetailForAuth(cond, lookup = false) {
    return this.getOne(cond, { projection: {}, lookup });
  }
}

module.exports = new User();
