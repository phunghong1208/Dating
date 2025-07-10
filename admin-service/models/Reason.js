'use strict';

const BaseModel = require('../models/Base');
const Entities = require('../../shared-entities');

class Reason extends BaseModel {
  constructor() {
    super('Reason', Entities.reasons);
    this.allowFields = ['_id', 'reason', 'details'];
  }
}

module.exports = new Reason();
