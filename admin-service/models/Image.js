'use strict';

const BaseModel = require('../models/Base');
const Entities = require('../../shared-entities');
const Utils = require('../../utils/index');
const DBUtils = require('../../utils/Database');

class Image extends BaseModel {
  constructor() {
    super('Image', Entities.images);
  }

  async getImagesByUserId(userId) {
    return this.find({ userId: userId });
  }

  async getListImage(options) {
    let lists = await this.lists(options);

    return lists;
  }

  /**
   * Update status image AI
   * @param {*} client
   * @param {*} params
   * @param {*} authUser
   * @returns
   * Create by: nvduc
   */
  async updateAvatarStatusAI(params) {
    let ret = await this.findOneAndUpdate(
      { 'avatars.id': params.avatarId },
      {
        $set: {
          'avatars.$.aiStatus': params.aiStatus,
          'avatars.$.aiPoint': params.aiPoint,
          'avatars.$.aiViolateOption':
            params.aiViolateOption.length !== 0 ? params.aiViolateOption : [],
          'avatars.$.updateAI': Utils.getCreateBy(),
        },
      },
      {
        new: true,
        useFindAndModify: false,
        arrayFilters: [{ 'elem.id': params.avatarId }],
      },
    );
    return ret;
  }

  async updateAvatarUrl(params) {
    let ret = await this.findOneAndUpdate(
      { 'avatars.id': params.avatarId },
      {
        $set: {
          // 'avatars.$.meta': params.meta,
          'avatars.$.reviewerStatus': 0,
          'avatars.$.aiStatus': 0,
          'avatars.$.comment': '',
          'avatars.$.reviewerViolateOption': [],
          'avatars.$.aiViolateOption': [],
          'avatars.$.aiPoint': 0,
        },
      },
      {
        new: true,
        useFindAndModify: false,
        arrayFilters: [{ 'elem.id': params.avatarId }],
      },
    );
    return ret;
  }

  async getGroupImages(objectId) {
    // console.log('objectId', objectId);
    let selection = {
      avatars: 1,
    };

    let pipeline = [
      {
        $match: { userId: objectId }, // Điều kiện userId
      },
      {
        $unwind: {
          path: `$avatars`,
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          'avatars.reviewerStatus': {
            $exists: true,
            $in: [1],
          },
        },
      },
      {
        $group: {
          _id: '$_id',
          avatars: { $push: '$avatars' }, // Gom các avatar vào một mảng mới
        },
      },
    ];
    // pipeline.push({ $project: selection });

    let rs = await this.execAggregate(pipeline);

    return rs[0];
  }

  async getForCardImage(options, params) {
    let selection = options.projection || {
      userId: 1,
      avatars: 1,
      'profiles.fullname': 1,
      'profiles.onlineNow': 1,
      'profiles.disable': 1,
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
          localField: 'userId', // Trường trong bảng hiện tại
          foreignField: '_id', // Trường trong bảng bạn muốn tham gia
          as: 'profiles', // Tên của trường kết quả sau khi tham gia
        },
      },
      {
        $unwind: {
          path: `$avatars`,
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          'avatars.reviewerStatus': {
            $exists: true,
            $in:
              params.statusReview === -1
                ? [0, 1, 2]
                : [parseInt(params.statusReview)],
          },
          'avatars.aiStatus': {
            $exists: true,
            $in:
              params.statusAI === -1 ? [0, 1, 2] : [parseInt(params.statusAI)],
          },
        },
      },

      {
        $match: {
          'profiles.fullname': { $regex: params.nameQuery, $options: 'i' }, // Bổ sung filter theo fullname
        },
      },
    ];

    if (options.pageSize > 0) {
      let pCount = [...pipeline, { $count: 'total' }];
      if (sorts) pipeline.push({ $sort: sorts });
      // skip: from, limit: to
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

  async getHistoryImageByUsers(options, params, req) {
    let selection = options.projection || {
      userId: 1,
      avatars: 1,
      'profiles.fullname': 1,
      'profiles.onlineNow': 1,
      'profiles.disable': 1,
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
          localField: 'userId', // Trường trong bảng hiện tại
          foreignField: '_id', // Trường trong bảng bạn muốn tham gia
          as: 'profiles', // Tên của trường kết quả sau khi tham gia
        },
      },
      {
        $unwind: {
          path: `$avatars`,
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: { 'avatars.update.by': req.authUser._id },
      },
      {
        $match: {
          'avatars.reviewerStatus': {
            $exists: true,
            $in:
              params.statusReview === -1
                ? [1, 2]
                : [parseInt(params.statusReview)],
          },
          'avatars.aiStatus': {
            $exists: true,
            $in:
              params.statusAI === -1 ? [0, 1, 2] : [parseInt(params.statusAI)],
          },
        },
      },

      {
        $match: {
          'profiles.fullname': { $regex: params.nameQuery, $options: 'i' }, // Bổ sung filter theo fullname
        },
      },
    ];

    if (options.pageSize > 0) {
      let pCount = [...pipeline, { $count: 'total' }];
      if (sorts) pipeline.push({ $sort: sorts });
      // skip: from, limit: to
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

  async getTotalImageUsers() {
    let pipelinePendingReviewer = [
      {
        $unwind: {
          path: `$avatars`,
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: { 'avatars.reviewerStatus': { $exists: true, $in: [0] } },
      },
    ];

    let pipelineApproveReviewer = [
      {
        $unwind: {
          path: `$avatars`,
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: { 'avatars.reviewerStatus': { $exists: true, $in: [1] } },
      },
    ];

    let pipelineRejectReviewer = [
      {
        $unwind: {
          path: `$avatars`,
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: { 'avatars.reviewerStatus': { $exists: true, $in: [2] } },
      },
    ];

    let pipelinePendingAI = [
      {
        $unwind: {
          path: `$avatars`,
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: { 'avatars.aiStatus': { $exists: true, $in: [0] } },
      },
    ];

    let pipelineApproveAI = [
      {
        $unwind: {
          path: `$avatars`,
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: { 'avatars.aiStatus': { $exists: true, $in: [1] } },
      },
    ];

    let pipelineRejectAI = [
      {
        $unwind: {
          path: `$avatars`,
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: { 'avatars.aiStatus': { $exists: true, $in: [2] } },
      },
    ];
    let pCountPendingReviewer = [
      ...pipelinePendingReviewer,
      { $count: 'total' },
    ];
    let pCountApproveReviewer = [
      ...pipelineApproveReviewer,
      { $count: 'total' },
    ];
    let pCountRejectReviewer = [...pipelineRejectReviewer, { $count: 'total' }];

    let pCountPendingAI = [...pipelinePendingAI, { $count: 'total' }];
    let pCountApproveAI = [...pipelineApproveAI, { $count: 'total' }];
    let pCountRejectAI = [...pipelineRejectAI, { $count: 'total' }];
    let result = await Promise.all([
      this.getCountWithAggregate(pCountPendingReviewer),
      this.getCountWithAggregate(pCountApproveReviewer),
      this.getCountWithAggregate(pCountRejectReviewer),
      this.getCountWithAggregate(pCountPendingAI),
      this.getCountWithAggregate(pCountApproveAI),
      this.getCountWithAggregate(pCountRejectAI),
    ]);


    return {
      totalPendingReviewer: result[0],
      totalApproveReviewer: result[1],
      totalRejectReviewer: result[2],
      totalPendingAI: result[3],
      totalApproveAI: result[4],
      totalRejectAI: result[5],
    };
  }

  async updateImageStatus(params, authUser) {
    let ret = await this.updateItem(
      { _id: params.imageId, 'avatars.id': params.avatarId },
      {
        $set: {
          'avatars.$.reviewerStatus': params.reviewerStatus,
          'avatars.$.comment':
            params.comment.length !== 0 ? params.comment : '',
          'avatars.$.reviewerViolateOption':
            params.reviewerViolateOption.length !== 0
              ? params.reviewerViolateOption
              : [],
          'avatars.$.update': Utils.getCreateBy(authUser),
        },
      },
    );
    return ret;
  }
}

module.exports = (mongoose, entity) => new BaseModel('Image', entity, mongoose);
