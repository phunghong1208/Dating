'use strict';
/**
 * @description Schema of FoodPreference.
 */
const BaseModel = require('../models/Base');
const Entities = require('../../shared-entities');

class FoodPreference extends BaseModel {
  constructor() {
    super('FoodPreference', Entities.commons);
  }
}

module.exports = new FoodPreference();
