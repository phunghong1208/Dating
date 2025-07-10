'use strict';

const BaseModel = require('./Base');
const Entities = require('../../shared-entities');

class Topic extends BaseModel {
  constructor() {
    super('Topic', Entities.topics);
  }
}

module.exports = new Topic();
