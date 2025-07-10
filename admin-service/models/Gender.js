'use strict';

const BaseModel = require('../models/Base');
const Entities = require('../../shared-entities');

class Gender extends BaseModel {
  constructor() {
    super('Gender', Entities.commons);
  }
}

module.exports = new Gender();
