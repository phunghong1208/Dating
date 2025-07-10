'use strict';
/**
 * @description Schema of Education.
 */
const BaseModel = require('../models/Base');
const Entities = require('../../shared-entities');

class Education extends BaseModel {
  constructor() {
    super('Education', Entities.commons);
  }
}

module.exports = new Education();
