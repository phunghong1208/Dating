'use strict';
/**
 * @description Schema of Zodiac.
 */
const BaseModel = require('../models/Base');
const Entities = require('../../shared-entities');

class Zodiac extends BaseModel {
  constructor() {
    super('Zodiac', Entities.commons);
  }
}

module.exports = new Zodiac();
