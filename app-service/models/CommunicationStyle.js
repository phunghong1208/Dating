'use strict';
/**
 * @description Schema of CommunicationStyle.
 */
const BaseModel = require('./Base');
const Entities = require('../databases/entities');

class CommunicationStyle extends BaseModel {
  constructor() {
    super('CommunicationStyle', Entities.commons);
  }
}

module.exports = new CommunicationStyle();
