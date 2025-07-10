'use strict';

const BaseModel = require('../models/Base');
const Entities = require('../databases/entities');

class School extends BaseModel {
  constructor() {
    super('School', Entities.schools);
  }
}

module.exports = new School();
