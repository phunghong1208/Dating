'use strict';

const BaseModel = require('./Base');
const Entities = require('../../shared-entities');

class Interest extends BaseModel {
  constructor() {
    super('Interest', Entities.commons);
  }
}

module.exports = new Interest();
