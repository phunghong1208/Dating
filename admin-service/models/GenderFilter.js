'use strict';

const BaseModel = require('../models/Base');
const Entities = require('../databases/entities');

class GenderFilter extends BaseModel {
  constructor() {
    super('GenderFilter', Entities.commons);
  }
}

module.exports = new GenderFilter();
