'use strict';
/**
 * @description Schema of Payment.
 */
const BaseModel = require('./Base');
const Entities = require('../databases/entities');

class Payment extends BaseModel {
  constructor() {
    super('Payment', Entities.payments);
    this.projection = {
      customer: 1,
      category: 1,
      amount: 1,
      unit: 1,
      descriptions: 1,
      insert: 1,
    };
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

module.exports = new Payment();
