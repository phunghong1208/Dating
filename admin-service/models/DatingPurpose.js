'use strict';
/**
 * @description Schema of DatingPurpose.
 */
const BaseModel = require('../models/Base');
const Entities = require('../../shared-entities');

class DatingPurpose extends BaseModel {
  constructor() {
    super('DatingPurpose', Entities.commons);
  }
}

module.exports = new DatingPurpose();
