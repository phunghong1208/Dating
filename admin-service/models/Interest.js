'use strict';

const BaseModel = require('../models/Base');
const Entities = require('../../shared-entities');

class Interest extends BaseModel {
  constructor() {
    super('Interest', Entities.commons);
  }
}

module.exports = new Interest();
