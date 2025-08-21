'use strict';
/**
 * @description Schema of PromptCategory.
 */
const BaseModel = require('../models/Base');
const Entities = require('../databases/entities');

class PromptCategory extends BaseModel {
  constructor() {
    super('PromptCategory', Entities.commons);
  }
}

module.exports = new PromptCategory();
