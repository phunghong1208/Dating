'use strict';

const BaseModel = require('./Base');
const Entities = require('../databases/entities');

class Topic extends BaseModel {
  constructor() {
    super('Topic', Entities.topics);
  }
}

module.exports = new Topic();
