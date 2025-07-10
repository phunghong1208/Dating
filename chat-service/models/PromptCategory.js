'use strict';
/**
 * @description Schema of PromptCategory.
 */
const BaseModel = require('./Base');
const Entities = require('../../shared-entities');

class PromptCategory extends BaseModel {
  constructor() {
    super('PromptCategory', Entities.commons);
  }
}

module.exports = new PromptCategory();
