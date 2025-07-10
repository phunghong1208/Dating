'use strict';
/**
 * @description Schema of Pet.
 */
const BaseModel = require('../models/Base');
const Entities = require('../databases/entities');

class Pet extends BaseModel {
  constructor() {
    super('Pet', Entities.commons);
  }
}

module.exports = new Pet();
