'use strict';
/**
 * @description Schema of Smoking.
 */
const BaseModel = require('../models/Base');
const Entities = require('../databases/entities');

class Smoking extends BaseModel {
  constructor() {
    super('Smoking', Entities.commons);
  }
}

module.exports = new Smoking();
