'use strict';
/**
 * @description Schema of Activity.
 */
const BaseModel = require('../models/Base');
const Entities = require('../databases/entities');
const DBUtils = require('../utils/Database');

class Activity extends BaseModel {
  constructor() {
    super('Activity', Entities.activities);
    this.projection = {
      agentId: 1,
      interactorId: 1,
      promptImageId: 1,
      actionType: 1,
      typeOrder: 1,
      insert: 1,
      agent: 1,
      interactor: 1,
    };
    this.relations = [
      {
        path: 'agent',
        select: 'fullname phone email profiles onlineNow disable',
        ref: 'Customer',
        localField: 'agentId',
      },
      {
        path: 'interactor',
        select: 'fullname phone email profiles onlineNow disable',
        ref: 'Customer',
        localField: 'interactorId',
      },
    ];
  }

  async getInteractorIdsForAuthUser(authUser) {
    // let lists = await this.find({ agentId: authUser._id });
    let lists = await this.find({
      $and: [
        { agentId: authUser._id }, // Điều kiện ban đầu
        { actionType: 1 }, // Điều kiện thêm mới
      ],
    });

    return lists.map(item => item.interactorId);
  }

  async getAgenIdsForAuthUser(authUser) {
    let lists = await this.find({ interactorId: authUser._id });
    return lists.map(item => item.agentId);
  }

  async getListActivitiesByFilter(options, params) {
    let selection = options.projection || {
      agentId: 1,
      interactorId: 1,
      actionType: 1,
      promptImageId: 1,
      typeOrder: 1,
      'agents.fullname': 1,
      'interactors.fullname': 1,
      typeOption: 1,
    };

    let sorts = options.sorts || { 'insert.when': -1 };

    let pipeline = [
      {
        $match: {
          $and: [
            DBUtils.excludeSoftDelete({ ...options.filters }),
            // Lọc theo actionType
          ],
        },
      },
      {
        $match: {
          actionType: {
            $exists: true,
            $in:
              params.actionType === -1
                ? [0, 1, 2]
                : [parseInt(params.actionType)],
          },
        },
      },

      {
        $lookup: {
          from: 'customers', // Tên bảng bạn muốn tham gia
          localField: 'agentId', // Trường trong bảng hiện tại
          foreignField: '_id', // Trường trong bảng bạn muốn tham gia
          as: 'agents', // Tên của trường kết quả sau khi tham gia
        },
      },
      {
        $lookup: {
          from: 'customers', // Tên bảng bạn muốn tham gia
          localField: 'interactorId', // Trường trong bảng hiện tại
          foreignField: '_id', // Trường trong bảng bạn muốn tham gia
          as: 'interactors', // Tên của trường kết quả sau khi tham gia
        },
      },
    ];
    if (params.fullname) {
      pipeline.push({
        $match: {
          $or: [
            { 'agents.fullname': { $regex: new RegExp(params.fullname, 'i') } },
            {
              'interactors.fullname': {
                $regex: new RegExp(params.fullname, 'i'),
              },
            },
          ],
        },
      });
    }
    if (params.typeOrder === 0) {
      pipeline.push({
        $lookup: {
          from: 'images', // Tên bảng bạn muốn tham gia
          localField: 'interactorId', // Trường trong bảng hiện tại
          foreignField: 'userId', // Trường trong bảng bạn muốn tham gia
          as: 'typeOption', // Tên của trường kết quả sau khi tham gia
        },
      });
      pipeline.push({
        $addFields: {
          typeOption: {
            $map: {
              input: '$typeOption',
              as: 'img',
              in: {
                $mergeObjects: [
                  '$$img',
                  {
                    avatars: {
                      $filter: {
                        input: '$$img.avatars',
                        as: 'avatar',
                        cond: { $eq: ['$$avatar.id', '$promptImageId'] },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      });
    }
    if (params.typeOrder === 1) {
      pipeline.push({
        $lookup: {
          from: 'promptanswers', // Tên bảng bạn muốn tham gia
          localField: 'interactorId', // Trường trong bảng hiện tại
          foreignField: 'userId', // Trường trong bảng bạn muốn tham gia
          as: 'typeOption', // Tên của trường kết quả sau khi tham gia
        },
      });
      pipeline.push({
        $addFields: {
          typeOption: {
            $map: {
              input: '$typeOption',
              as: 'prompt',
              in: {
                $mergeObjects: [
                  '$$prompt',
                  {
                    promptAnswers: {
                      $filter: {
                        input: '$$prompt.promptAnswers',
                        as: 'promptanswer',
                        cond: { $eq: ['$$promptanswer.id', '$promptImageId'] },
                      },
                    },
                  },
                ],
              },
            },
          },
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
      console.log('rs[0]', rs[0]);

      return DBUtils.paginationResult(rs[0], rs[1], options, options.query);
    }
  }
}

module.exports = new Activity();
