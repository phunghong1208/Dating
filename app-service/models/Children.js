'use strict';
/**
 * @description Schema of Children.
 */
const BaseModel = require('./Base');
const Entities = require('../databases/entities');

class Children extends BaseModel {
  constructor() {
    super('Children', Entities.commons);
  }
}

module.exports = new Children();
