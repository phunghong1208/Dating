'use strict';
/**
 * @description Schema of Drug.
 */
const BaseModel = require('../models/Base');
const Entities = require('../databases/entities');

class Drug extends BaseModel {
  constructor() {
    super('Drug', Entities.commons);
  }
}

module.exports = new Drug();
