'use strict';
/**
 * @description Schema of Sexual.
 */
const BaseModel = require('./Base');
const Entities = require('../../shared-entities');

class Sexual extends BaseModel {
  constructor() {
    super('Sexual', Entities.commons);
  }
}

module.exports = new Sexual();
