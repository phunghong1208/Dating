'use strict';
/**
 * @description Schema of Device.
 */
const BaseModel = require('../models/Base');
const Entities = require('../databases/entities');

class Device extends BaseModel {
  constructor() {
    super('Device', Entities.devices);
  }

  async getByClientId(userId) {
    return this.find({ userId });
  }

  async getByClientIds(clientIds) {
    return this.find({ userId: { $in: clientIds } });
  }

  async checkExist(fcmToken) {
    // let check = false;
    let objectCheck = {
      device: {},
      check: false,
    };
    let exist = await this.getOne({ fcmToken });
    console.log('Data-exits', exist);
    if (exist) {
      objectCheck.device = exist;
      objectCheck.check = true;
    }
    console.log('objectCheck', objectCheck);
    return objectCheck;
  }
}

module.exports = new Device();
