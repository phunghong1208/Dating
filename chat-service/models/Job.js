'use strict';

const BaseModel = require('./Base');
const Entities = require('../databases/entities');

class Job extends BaseModel {
  constructor() {
    super('Job', Entities.jobs);
  }
}

module.exports = new Job();
