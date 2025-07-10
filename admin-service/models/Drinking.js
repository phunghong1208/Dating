'use strict';
/**
 * @description Schema of Drinking.
 */
const BaseModel = require('../models/Base');
const Entities = require('../../shared-entities');

class Drinking extends BaseModel {
  constructor() {
    super('Drinking', Entities.commons);
  }
}

module.exports = new Drinking();
