'use strict';

const to = require('await-to-js').default;
const BaseService = require('./Base');
const Customer = require('../shared-models/Customer');
const Activity = require('../shared-models/Activity');

class Service extends BaseService {
  constructor() {
    super(Service);
    this.mCustomer = Customer;
    this.model = Activity;
  }

  async checkRecords() {
    let [err, lists] = await to(this.model.find({}));
    if (err) throw Error(err.message || err);
    let userIds = [],
      removeIds = [];
    if (lists && lists.length) {
      lists.map(item => {
        let { agentId, interactorId } = item;
        if (userIds.indexOf(agentId) == -1) userIds.push(agentId);
        if (userIds.indexOf(interactorId) == -1) userIds.push(interactorId);
      });
      let mapUsers = await this.mCustomer.buildMapObjects(userIds);
      lists.map(item => {
        let { agentId, interactorId } = item;
        if (!mapUsers[agentId] || !mapUsers[interactorId]) {
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
