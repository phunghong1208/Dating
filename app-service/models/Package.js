'use strict';

const BaseModel = require('./Base');
const Entities = require('../../shared-entities');

class Package extends BaseModel {
  constructor() {
    super('Package', Entities.packages);
  }

  async getSelections() {
    return this.find({}, { sorts: { 'insert.when': -1 } });
  }
}

module.exports = new Package();
