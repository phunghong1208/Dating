'use strict';

const to = require('await-to-js').default;
const BaseService = require('./Base');
const Customer = require('../shared-models/Customer');
const Reason = require('../shared-models/Reason');
const Report = require('../shared-models/Report');

class Service extends BaseService {
  constructor() {
    super(Service);
    this.mCustomer = Customer;
    this.mReason = Reason;
    this.model = Report;
  }

  async checkRecords() {
    let [err, lists] = await to(this.model.find({}));
    if (err) throw Error(err.message || err);
    let userIds = [],
      reasonIds = [],
      removeIds = [];
    if (lists && lists.length) {
      lists.map(item => {
        let { reportId, userId, reasonId } = item;
        if (userIds.indexOf(reportId) == -1) userIds.push(reportId);
        if (userIds.indexOf(userId) == -1) userIds.push(userId);
        if (reasonId && reasonIds.indexOf(reasonId) == -1)
          reasonIds.push(reasonId);
      });
      let mapUsers = await this.mCustomer.buildMapObjects(userIds);
      let mapReasons = await this.mReason.buildMapObjects(reasonIds);
      lists.map(item => {
        let { reportId, userId, reasonId } = item;
        if (
          !mapUsers[reportId] ||
          !mapUsers[userId] ||
          (reasonId && !mapReasons[reasonId])
        ) {
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
