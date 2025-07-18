'use strict';
/**
 * @description Schema of Personality.
 */
const BaseModel = require('./Base');
const Entities = require('../databases/entities');

class Personality extends BaseModel {
  constructor() {
    super('Personality', Entities.commons);
  }
}

module.exports = new Personality();
