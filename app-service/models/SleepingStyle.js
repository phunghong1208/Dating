'use strict';
/**
 * @description Schema of SleepingStyle.
 */
const BaseModel = require('./Base');
const Entities = require('../../shared-entities');

class SleepingStyle extends BaseModel {
  constructor() {
    super('SleepingStyle', Entities.commons);
  }
}

module.exports = new SleepingStyle();
