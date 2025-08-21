'use strict';
/**
 * @description Schema of Ethnicity: Sắc tộc
 */
const BaseModel = require('./Base');
const Entities = require('../databases/entities');

class Ethnicity extends BaseModel {
  constructor() {
    super('Ethnicity', Entities.commons);
  }
}

module.exports = new Ethnicity();
