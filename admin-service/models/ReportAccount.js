'use strict';

const BaseModel = require('../models/Base');
const Entities = require('../../shared-entities');
const DBUtils = require('../utils/Database');
const Utils = require('../utils');

class ReportAccount extends BaseModel {
  constructor() {
    super('ReportAccount', Entities.reportaccounts);
  }

  async getCardReportAccount(options, params) {
    let selection = options.projection || {
      reasonCode: 1,
      codeTitle: 1,
      codeDetail: 1,
      comments: 1,
      agentReportId: 1,
      reportedSubjectId: 1,
      'profileAgent.fullname': 1,
      'profileAgent.phone': 1,
      'profileAgent.onlineNow': 1,
      'profileAgent.explore': 1,
      'profileAgent.profiles': 1,
      'profileAgent.block': 1,
      'profileAgent.unlock': 1,
      'profileAgent.disable': 1,
      'profileReported.fullname': 1,
      'profileReported.phone': 1,
      'profileReported.onlineNow': 1,
      'profileReported.explore': 1,
      'profileReported.profiles': 1,
      'profileReported.block': 1,
      'profileReported.unlock': 1,
      'profileReported.disable': 1,
      avatarReported: 1,
      avatarAgent: 1,
    };
    let sorts = options.sorts || { 'insert.when': -1 };

    let pipeline = [
      {
        $match: DBUtils.excludeSoftDelete({
          ...options.filters,
        }),
      },
      {
        $lookup: {
          from: 'customers', // Tên bảng bạn muốn tham gia
          localField: 'agentReportId', // Trường trong bảng hiện tại
          foreignField: '_id', // Trường trong bảng bạn muốn tham gia
          as: 'profileAgent', // Tên của trường kết quả sau khi tham gia
        },
      },
      {
        $lookup: {
          from: 'customers', // Tên bảng bạn muốn tham gia
          localField: 'reportedSubjectId', // Trường trong bảng hiện tại
          foreignField: '_id', // Trường trong bảng bạn muốn tham gia
          as: 'profileReported', // Tên của trường kết quả sau khi tham gia
        },
      },
      {
        $lookup: {
          from: 'images', // Tên bảng bạn muốn tham gia
          localField: 'reportedSubjectId', // Trường trong bảng hiện tại
          foreignField: 'userId', // Trường trong bảng bạn muốn tham gia
          as: 'avatarReported', // Tên của trường kết quả sau khi tham gia
        },
      },
      {
        $lookup: {
          from: 'images', // Tên bảng bạn muốn tham gia
          localField: 'agentReportId', // Trường trong bảng hiện tại
          foreignField: 'userId', // Trường trong bảng bạn muốn tham gia
          as: 'avatarAgent', // Tên của trường kết quả sau khi tham gia
        },
      },
    ];

    if (params.fullname) {
      let regex = new RegExp(params.fullname, 'i'); // 'i' để không phân biệt chữ hoa chữ thường

      pipeline.push({
        $match: {
          'profileReported.fullname': { $regex: regex },
        },
      });
    }

    if (options.pageSize > 0) {
      let pCount = [...pipeline, { $count: 'total' }];
      if (sorts) pipeline.push({ $sort: sorts });
      let skip = options.pageSize * options.currentPage;
      let limit = options.pageSize * (options.currentPage + 1);
      pipeline = pipeline.concat([{ $limit: limit }, { $skip: skip }]);
      pipeline.push({ $project: selection });

      let rs = await Promise.all([
        this.execAggregate(pipeline),
        this.getCountWithAggregate(pCount),
      ]);
      return DBUtils.paginationResult(rs[0], rs[1], options, options.query);
    } else {
      if (sorts) pipeline.push({ $sort: sorts });
      pipeline.push({ $project: selection });

      return this.execAggregate(pipeline);
    }
  }
}

module.exports = new ReportAccount();
