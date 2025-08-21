'use strict';

const to = require('await-to-js').default;
const BaseService = require('./Base');
const Customer = require('../models/Customer');

class Service extends BaseService {
  constructor() {
    super(Service);
    this.model = Customer;
  }

  async getClients(clientIds) {
    return this.model.getClients(clientIds);
  }
 
}

module.exports = new Service();
