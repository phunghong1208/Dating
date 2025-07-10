'use strict';

const BaseModel = require('./Base');
const Entities = require('../../shared-entities');

class GenderFilter extends BaseModel {
  constructor() {
    super('GenderFilter', Entities.commons);
  }
}

module.exports = new GenderFilter();
