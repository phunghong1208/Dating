'use strict';
/**
 * @description Schema of FamilyPlan.
 */
const BaseModel = require('./Base');
const Entities = require('../../shared-entities');

class FamilyPlan extends BaseModel {
  constructor() {
    super('FamilyPlan', Entities.commons);
  }
}

module.exports = new FamilyPlan();
