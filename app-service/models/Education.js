'use strict';
/**
 * @description Schema of Education.
 */
const BaseModel = require('./Base');
const Entities = require('../databases/entities');

class Education extends BaseModel {
  constructor() {
    super('Education', Entities.commons);
  }
}

module.exports = new Education();
