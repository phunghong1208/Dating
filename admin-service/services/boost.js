'use strict';

const to = require('await-to-js').default;
const BaseService = require('./Base');
const Customer = require('../models/Customer');
const Boost = require('../models/Boost');

class Service extends BaseService {
  constructor() {
    super(Service);
    this.mCustomer = Customer;
    this.model = Boost;
  }

  async checkRecords() {
    let [err, lists] = await to(this.model.find({}));
    if (err) throw Error(err.message || err);
    let userIds = [],
      removeIds = [];
    if (lists && lists.length) {
      lists.map(item => {
        let { customer } = item;
        if (userIds.indexOf(customer) == -1) userIds.push(customer);
      });
      let mapUsers = await this.mCustomer.buildMapObjects(userIds);
      lists.map(item => {
        let { customer } = item;
        if (!mapUsers[customer]) {
          removeIds.push(item._id);
        }
      });
      if (removeIds.length) {
        await this.model.deleteByIds(removeIds);
      }
    }
    return { deleted: removeIds.length };
  }
}

module.exports = new Service();
