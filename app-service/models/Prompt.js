'use strict';
/**
 * @description Schema of Prompt.
 */
const BaseModel = require('./Base');
const Entities = require('../databases/entities');

class Prompt extends BaseModel {
  constructor() {
    super('Prompt', Entities.prompt);
  }
}

module.exports = new Prompt();
