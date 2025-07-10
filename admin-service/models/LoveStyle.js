'use strict';
/**
 * @description Schema of LoveStyle.
 */
const BaseModel = require('../models/Base');
const Entities = require('../databases/entities');

class LoveStyle extends BaseModel {
  constructor() {
    super('LoveStyle', Entities.commons);
  }
}

module.exports = new LoveStyle();
