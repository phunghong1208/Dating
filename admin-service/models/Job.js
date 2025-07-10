'use strict';

const BaseModel = require('../models/Base');
const Entities = require('../../shared-entities');

class Job extends BaseModel {
  constructor() {
    super('Job', Entities.jobs);
  }
}

module.exports = new Job();
