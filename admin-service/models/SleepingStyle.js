'use strict';
/**
 * @description Schema of SleepingStyle.
 */
const BaseModel = require('../models/Base');
const Entities = require('../databases/entities');

class SleepingStyle extends BaseModel {
  constructor() {
    super('SleepingStyle', Entities.commons);
  }
}

module.exports = new SleepingStyle();
