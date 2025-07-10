'use strict';
/**
 * @description Schema of FamilyPlan.
 */
const BaseModel = require('../models/Base');
const Entities = require('../databases/entities');

class FamilyPlan extends BaseModel {
  constructor() {
    super('FamilyPlan', Entities.commons);
  }
}

module.exports = new FamilyPlan();
