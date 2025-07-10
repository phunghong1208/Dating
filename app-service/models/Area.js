'use strict';

const BaseModel = require('./Base');
const Entities = require('../databases/entities');

class Area extends BaseModel {
  constructor() {
    super('Area', Entities.areas);
  }
}

module.exports = new Area();
