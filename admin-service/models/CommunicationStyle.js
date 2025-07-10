'use strict';
/**
 * @description Schema of CommunicationStyle.
 */
const BaseModel = require('../models/Base');
const Entities = require('../../shared-entities');

class CommunicationStyle extends BaseModel {
  constructor() {
    super('CommunicationStyle', Entities.commons);
  }
}

module.exports = new CommunicationStyle();
