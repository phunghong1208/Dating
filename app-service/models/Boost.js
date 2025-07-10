'use strict';
/**
 * @description Schema of BoostLog.
 */
const BaseModel = require('../models/Base');
const Entities = require('../../shared-entities');

class Boost extends BaseModel {
  constructor() {
    super('Boost', Entities.boosts);
    this.projection = { customer: 1, startTime: 1, endTime: 1, duration: 1 };
    this.allowFields = ['_id', 'customer', 'startTime', 'endTime', 'duration'];
    this.relations = [
      {
        path: 'customer',
        select: 'fullname phone email disable',
        ref: 'Customer',
        localField: 'customer',
      },
    ];
  }
}

module.exports = new Boost();
