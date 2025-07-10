'use strict';
/**
 * @description Schema of Customer.
 */
const BaseModel = require('./Base');
const Entities = require('../databases/entities');
const Utils = require('../utils');
const DBUtils = require('../utils/Database');
const Configs = require('../config');

class Customer extends BaseModel {
  constructor() {
    super('Customer', Entities.customers);
    this.projection = { delete: 0, __v: 0, hash: 0, salt: 0 };
    this.allowFields = [
      '_id',
      'oAuth2Id',
      'fullname',
      'username',
      'email',
      'phone',
      'dob',
      'profiles',
      'settings',
      'verifyStatus',
      'activeStatus',
      'lastActiveTime',
      'location',
      'coins',
      'explore',
      'languageMachine',
      'plusCtrl',
      'numberLike',
      'numberSuperLike',
      'numberBooster',
      'boostInfo',
      'packageId',
      'pkgRegistrationDate',
      'pkgExpirationDate',
      'package',
      'insert',
      'update',
    ];
    this.relations = [
      {
        path: '_id',
        select: 'name description options usagePeriod',
        ref: 'Package',
        localField: 'packageId',
      },
    ];
  }

  getProfiles(record, fields = null) {
    if (!fields) fields = [...this.allowFields];
    fields = fields.filter(el => el !== 'insert' && el !== 'update');
    return Utils.fillOptionalFields(record, {}, fields);
  }

  get projectionForChannel() {
    return {
      _id: 1,
      fullname: 1,
      oAuth2Id: 1,
      phone: 1,
      email: 1,
      dob: 1,
      profiles: 1,
      metadata: 1,
      location: 1,
      explore: 1,
      onlineNow: 1,
    };
  }

  async getByConditions(conds, opts = null) {
    opts = opts || {};
    if (!opts.projection) opts.projection = this.projectionForChannel;
    return this.find(conds, opts);
  }

  async getClients(clientIds) {
    return this.getByConditions({ _id: { $in: clientIds } });
  }

  calculateAge(age) {
    const today = new Date();
    return new Date(
      today.getFullYear() - age,
      today.getMonth(),
      today.getDate(),
    );
  }

  async getCardByFilter(clientIds, params) {
    let today = new Date(); // Lấy ngày hiện tại
    let query = {
      _id: { $in: clientIds }, // Tìm kiếm theo danh sách các ID người dùng
      dob: {
        $gt: new Date(
          today.getFullYear() - params.ageMax - 1,
          today.getMonth(),
          today.getDate(),
        ), // Lọc theo tuổi lớn hơn 18
        $lte: new Date(
          today.getFullYear() - params.ageMin,
          today.getMonth(),
          today.getDate(),
        ), // Lọc theo tuổi nhỏ hơn hoặc bằng 30
      },
      // 'explore.verified': false,
      // 'profiles.about': params.statusBio ? { $ne: '' } : '', // True: khác "" False : được ""
      // 'profiles.about': params.statusBio ? { $ne: null } : null, // True: khác null False : được null
    };
    return this.find(query);
  }

  async getClientProfile(clientId) {
    return this.getById(clientId, { projection: this.projectionForChannel });
  }

  async buildMapForChannel(clientIds) {
    let lists = await this.getClients(clientIds);
    // console.log('lists', lists.length);
    // let map = {};
    // if (lists && lists.length) {
    //   lists.map(item => {
    //     map[item._id] = item;
    //   });
    // }
    return lists;
  }

  async setOnlineNow(id, onlineNow) {
    return this.updateOne(id, { onlineNow });
  }

  async getByAvatar(avatarId) {
    return this.getOne({ 'profiles.avatars.id': avatarId });
  }

  /**
   * Update status reviewer
   * @param {*} client
   * @param {*} params
   * @param {*} authUser
   * @returns
   * Create by: nvduc
   */
  async updateAvatarStatus(client, params, authUser) {
    let ret = await this.updateItem(
      { _id: client._id, 'avatars.id': params.avatarId },
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
    // if (ret) {
    //   let pendingCount = client.profiles.avatars.filter(
    //     item =>
    //       item.id != params.avatarId &&
    //       (!item.status || item.status == Configs.avatars.status.pending),
    //   ).length;
    //   if (params.reviewerStatus == Configs.avatars.status.pending)
    //     pendingCount += 1;
    //   let isVerifiedAllAvatars = pendingCount == 0;
    //   if (isVerifiedAllAvatars !== client.isVerifiedAllAvatars) {
    //     this.updateOne(
    //       client._id,
    //       { 'profiles.isVerifiedAllAvatars': isVerifiedAllAvatars },
    //       {},
    //       authUser,
    //     );
    //   }
    // }
    return ret;
  }

  async updateCustomerUrl(element) {
    let ret = await this.updateItem(
      { _id: element._id },
      {
        $set: {
          explore: {
            verified: 0,
            topics: [],
          },
        },
      },
    );
    return ret;
  }

  async getListCustomer(options) {
    let lists = await this.lists(options);
    return lists;
  }

  async getForApproveImages(options) {
    let selection = options.projection || {
      oAuth2Id: 1,
      email: 1,
      phone: 1,
      dob: 1,
      fullname: 1,
      username: 1,
      disable: 1,
      onlineNow: 1,
      lastActiveTime: 1,
      location: 1,
      metadata: 1,
      profiles: 1,
      // "profiles.avatars": 1, "profiles.isVerifiedAllAvatars": 1,
      // "profiles.gender": 1, "profiles.about": 1, "profiles.address": 1,
      // "profiles.school": 1, "profiles.company": 1, "profile.jobTitle": 1
    };
    let sorts = options.sorts || { 'insert.when': -1 }; // default sort by createdAt
    let pipeline = [
      {
        $match: DBUtils.excludeSoftDelete({
          ...options.filters,
          'profiles.isVerifiedAllAvatars': { $ne: true },
        }),
      },
      {
        $unwind: {
          path: `$profiles.avatars`,
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: { 'profiles.avatars.status': 0 },
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

  async getListModelCardCustomer(options, params) {
    let selection = options.projection || {
      oAuth2Id: 1,
      email: 1,
      phone: 1,
      dob: 1,
      fullname: 1,
      username: 1,
      disable: 1,
      onlineNow: 1,
      lastActiveTime: 1,
      location: 1,
      metadata: 1,
      profiles: 1,
      settings: 1,
      activeStatus: 1,
      explore: 1,
      block: 1,
      unlock: 1,
    };
    let sorts = options.sorts || { 'insert.when': -1 }; // default sort by createdAt
    let pipeline = [
      {
        $match: DBUtils.excludeSoftDelete({
          ...options.filters,
        }),
      },
      {
        $match: {
          $or: [
            { phone: { $regex: new RegExp(params.nameQuery, 'i') } },
            { fullname: { $regex: new RegExp(params.nameQuery, 'i') } },
          ],
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
}

module.exports = new Customer();
