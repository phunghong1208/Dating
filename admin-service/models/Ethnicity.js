'use strict';
/**
 * @description Schema of Ethnicity: Sắc tộc
 */
const BaseModel = require('../models/Base');
const Entities = require('../../shared-entities');

class Ethnicity extends BaseModel {
  constructor() {
    super('Ethnicity', Entities.commons);
  }
}

module.exports = new Ethnicity();
