'use strict';

const BaseModel = require('./Base');
const Entities = require('../../shared-entities');

class Gender extends BaseModel {
  constructor() {
    super('Gender', Entities.commons);
  }
}

module.exports = new Gender();
