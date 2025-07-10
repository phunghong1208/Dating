'use strict';

const BaseModel = require('./Base');
const Entities = require('../databases/entities');

class Interest extends BaseModel {
  constructor() {
    super('Interest', Entities.commons);
  }
}

module.exports = new Interest();
