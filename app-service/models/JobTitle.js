'use strict';

const BaseModel = require('./Base');
const Entities = require('../databases/entities');

class JobTitle extends BaseModel {
  constructor() {
    super('JobTitle', Entities.jobTitles);
  }
}

module.exports = new JobTitle();
