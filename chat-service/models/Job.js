'use strict';

const BaseModel = require('./Base');
const Entities = require('../../shared-entities');

class Job extends BaseModel {
  constructor() {
    super('Job', Entities.jobs);
  }
}

module.exports = new Job();
