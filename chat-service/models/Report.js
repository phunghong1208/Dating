'use strict';
/**
 * @description Schema of Report.
 */
const BaseModel = require('../models/Base');
const Entities = require('../../shared-entities');

class Report extends BaseModel {
  constructor() {
    super('Report', Entities.reports);
    this.projection = {
      reportId: 1,
      userId: 1,
      reasonId: 1,
      reasonDetail: 1,
      comments: 1,
      insert: 1,
      reporter: 1,
      user: 1,
      reason: 1,
    };
    this.relations = [
      {
        path: 'reporter',
        select: 'fullname phone email disable',
        ref: 'Customer',
        localField: 'reportId',
      },
      {
        path: 'user',
        select: 'fullname phone email disable',
        ref: 'Customer',
        localField: 'userId',
      },
      {
        path: 'reason',
        select: 'reason details',
        ref: 'Reason',
        localField: 'reasonId',
      },
    ];
  }
}

module.exports = new Report();
