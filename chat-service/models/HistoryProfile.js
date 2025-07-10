'use strict';

const BaseModel = require('../models/Base');
const Entities = require('../databases/entities');

class HistoryProfile extends BaseModel {
  constructor() {
    super('HistoryProfile', Entities.historyProfile);
  }

  async getImagesByUserId(userId) {
    return this.find({ userId: userId });
  }
}

module.exports = new HistoryProfile();
