'use strict';
/**
 * @description Schema of Language.
 */
const BaseModel = require('./Base');
const Entities = require('../databases/entities');

class Language extends BaseModel {
  constructor() {
    super('Language', Entities.commons);
  }
}

module.exports = new Language();
