'use strict';

const BaseModel = require('../models/Base');
const Entities = require('../databases/entities');

class PromptAnswer extends BaseModel {
  constructor() {
    super('PromptAnswer', Entities.promptAnswer);
  }

  async getImagesByUserId(userId) {
    return this.find({ userId: userId });
  }
}

module.exports = new PromptAnswer();
