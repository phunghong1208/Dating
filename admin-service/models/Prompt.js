'use strict';
/**
 * @description Schema of Prompt.
 */
const BaseModel = require('../models/Base');
const Entities = require('../../shared-entities');

class Prompt extends BaseModel {
  constructor() {
    super('Prompt', Entities.prompt);
  }
}

module.exports = new Prompt();
