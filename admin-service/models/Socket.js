'use strict';
/**
 * @description Schema of Socket.
 */
const BaseModel = require('../models/Base');
const Entities = require('../databases/entities');

class Socket extends BaseModel {
  constructor() {
    super('Socket', Entities.sockets);
  }

  async getByClientId(userId) {
    return this.find({ userId });
  }

  async getByClientIds(clientIds) {
    return this.find({ userId: { $in: clientIds } });
  }

  async removeSession(sid) {
    return this.deleteOne({ sid });
  }
}

module.exports = new Socket();
