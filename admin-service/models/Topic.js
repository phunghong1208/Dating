'use strict';

const BaseModel = require('../models/Base');
const Entities = require('../../shared-entities');

class Topic extends BaseModel {
  constructor() {
    super('Topic', Entities.topics);
  }
}

module.exports = new Topic();
