'use strict';
/**
 * @description Schema of Social.
 */
const BaseModel = require('../models/Base');
const Entities = require('../databases/entities');

class Social extends BaseModel {
  constructor() {
    super('Social', Entities.commons);
  }
}

module.exports = new Social();
