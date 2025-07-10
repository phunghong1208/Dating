'use strict';
/**
 * @description Schema of FoodPreference.
 */
const BaseModel = require('./Base');
const Entities = require('../databases/entities');

class FoodPreference extends BaseModel {
  constructor() {
    super('FoodPreference', Entities.commons);
  }
}

module.exports = new FoodPreference();
