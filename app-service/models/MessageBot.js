'use strict';
/**
 * @description Schema of MessageBot.
 */
const BaseModel = require('../models/Base');
const Entities = require('../../shared-entities');

class MessageBot extends BaseModel {
  constructor() {
    super('MessageBot', Entities.commons);
  }

  async getListMessageBot() {
    return this.find({});
  }
}

module.exports = new MessageBot();
