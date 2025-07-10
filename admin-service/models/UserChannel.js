'use strict';
/**
 * @description Schema of UserChannel.
 */
const BaseModel = require('../models/Base');
const Entities = require('../databases/entities');

class UserChannel extends BaseModel {
  constructor() {
    super('UserChannel', Entities.userChannels);
  }

  async getByUserId(userId, options = null) {
    const conds = { userId };
    let promises = [this.find(conds, options)];
    if (options.pageSize > 0) {
      promises.push(this.getCount(conds));
    }
    let rs = await Promise.all(promises);
    return { lists: rs[0], total: rs[1] || 0 };
  }
}

module.exports = new UserChannel();
