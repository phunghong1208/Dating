'use strict';

const to = require('await-to-js').default;
const HttpUtil = require('../../utils/http');
const DBUtil = require('../../utils/Database');
const BaseController = require('../../Base');
const Activity = require('../models/Activity');
const Image = require('../models/Image');
const PromptAnswer = require('../models/PromptAnswer');
const Utils = require('../../utils');

const ServiceClient = require('../services/cards');
const { actions } = require('../../config');

/* 
  Thống kê tương tác của người dùng
*/
class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.model = Activity;
    this.sClient = ServiceClient;
    this.mImage = Image;
    this.mPromptAnswer = PromptAnswer;
  }

  // Tác nhân là authUser
  /**
   * Danh sách bạn like user khác
   * @param {*} req
   * @param {*} res
   * @returns
   */
  async listYouLikeOtherUser(req, res) {
    let { action = 'like' } = req.query;
    let actionTypes = Object.keys(actions);
    // Check action
    if (actionTypes.indexOf(action) == -1) {
      return HttpUtil.badRequest(
        res,
        'Invalid action param. Value must be ' + actionTypes.join(','),
      );
    }
    let authUser = req.authUser;
    let cond = { actionType: actions[action], agentId: authUser._id };
    if (action == 'like') {
      cond.actionType = { $ne: actions.nope };
    }
    let allowFilter = (req.query.allowFilter || 'true').toUpperCase() == 'TRUE';
    if (allowFilter) {
      let clientIds = await this.model.getAgenIdsForAuthUser(authUser); // danh sách tương tác với mình

      if (clientIds.length) {
        cond = { ...cond, interactorId: { $nin: clientIds } }; // bỏ đi những bản ghi tương tác với mình
      }
    }
    // TODO filters
    let options = this.handleFilter(req);
    let promises = [this.model.find(cond, options)];

    if (options.pageSize > 0 && options.currentPage > -1) {
      promises.push(this.model.getCount(cond));
    }
    let [err, rs] = await to(Promise.all(promises));

    if (err) return HttpUtil.internalServerError(res, err);

    let data = rs[0];
    let total = rs[1] || data.length;
    let lists = [];
    let updatedLists = [];

    if (data && data.length) {
      data.map(async item => {
        lists.push(item.interactorId);
      });

      [err, lists] = await to(this.getClients(lists, authUser));

      updatedLists = await Promise.all(
        lists.map(async element => {
          const clonedItem = Utils.cloneObject(element);
          let { ...obj } = clonedItem;
          const pipeline = [
            {
              $match: {
                userId: obj._id,
                'avatars.reviewerStatus': {
                  $exists: true,
                  $in: [0, 1, 2],
                },
              }, // Điều kiện userId
            },

            {
              $unwind: '$avatars',
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
          let resultImage = await this.mImage.execAggregate(pipeline);

          let resultPrompt = await this.mPromptAnswer.getByIdsUserId(
            element._id,
          );

          if (resultImage.length !== 0) {
            obj.profiles.avatars = [...resultImage[0].avatars];
          } else {
            obj.profiles.avatars = [];
          }
          if (resultPrompt) {
            obj.profiles.prompts = [...resultPrompt.promptAnswers];
          }

          return obj;
        }),
      );
      updatedLists = updatedLists.filter(x => x.profiles.avatars != 0);

      if (err) return HttpUtil.internalServerError(res, err);
    }
    let ret = DBUtil.paginationResult(updatedLists, total, options, req.query);
    return HttpUtil.success(res, ret);
  }
  /**
   * Filter user like
   * @param {*} req
   * @param {*} res
   * @returns
   */
  async listUserLikeFilter(req, res) {
    // Check fillter
    const requireParams = [
      { name: 'distance', dataType: 'number' },
      { name: 'ageMin', dataType: 'number' },
      { name: 'ageMax', dataType: 'number' },
      { name: 'numberPhoto', dataType: 'number' },
      { name: 'interests', dataType: 'array', acceptEmpty: true },
      { name: 'statusVerified', dataType: 'boolean' },
      { name: 'statusBio', dataType: 'boolean' },
      { name: 'lat', dataType: 'number' },
      { name: 'long', dataType: 'number' },
    ];
    let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);

    // Check action: like
    let { action = 'like' } = req.query;
    let actionTypes = Object.keys(actions);
    // Check action
    if (actionTypes.indexOf(action) == -1) {
      return HttpUtil.badRequest(
        res,
        'Invalid action param. Value must be ' + actionTypes.join(','),
      );
    }
    let authUser = req.authUser;
    let cond = { actionType: actions[action], interactorId: authUser._id };
    if (action == 'like') {
      cond.actionType = { $ne: actions.nope };
    }
    let allowFilter = (req.query.allowFilter || 'true').toUpperCase() == 'TRUE';
    if (allowFilter) {
      let clientIds = await this.model.getInteractorIdsForAuthUser(authUser); // danh sách mình tương tác
      if (clientIds.length) {
        cond = { ...cond, agentId: { $nin: clientIds } }; // bỏ đi những bản ghi mình đã tương tác
      }
    }
    // Find Data
    let options = this.handleFilter(req);
    let promises = [this.model.find(cond, options)];

    if (options.pageSize > 0 && options.currentPage > -1) {
      promises.push(this.model.getCount(cond));
    }
    let [err, rs] = await to(Promise.all(promises));
    if (err) return HttpUtil.internalServerError(res, err);

    let data = rs[0];
    let total = rs[1] || data.length;

    let lists = [];
    let updatedLists = [];
    // let resultData = [];
    if (data && data.length) {
      data.map(async item => {
        lists.push(item.agentId);
      });
      [err, lists] = await to(
        this.sClient.getCardByFilter(lists, params, authUser),
      );
      updatedLists = await Promise.all(
        lists.map(async element => {
          const clonedItem = Utils.cloneObject(element);
          let { ...obj } = clonedItem;

          const pipeline = [
            {
              $match: {
                userId: obj._id,
                'avatars.reviewerStatus': {
                  $exists: true,
                  $in: [0, 1, 2],
                },
              }, // Điều kiện userId
            },

            {
              $unwind: '$avatars',
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
          let resultImage = await this.mImage.execAggregate(pipeline);
          // let resultImage = await this.mImage.getByIdsUserId(element._id);

          let resultPrompt = await this.mPromptAnswer.getByIdsUserId(
            element._id,
          );

          if (resultImage.length !== 0) {
            obj.profiles.avatars = [...resultImage[0].avatars];
          } else {
            obj.profiles.avatars = [];
          }
          if (resultPrompt) {
            obj.profiles.prompts = [...resultPrompt.promptAnswers];
          }

          return obj;
        }),
      );
      updatedLists = updatedLists.filter(x => x.profiles.avatars != 0);
    }
    let ret = DBUtil.paginationResult(
      updatedLists,
      updatedLists.length,
      options,
      req.query,
    );

    return HttpUtil.success(res, ret);
  }

  // Đối tượng tác động là authUser
  /**
   * Danh sách user khác like bạn
   * @param {*} req
   * @param {*} res
   * @returns
   */
  async listUserOtherLikeYou(req, res) {
    let { action = 'like' } = req.query;
    let actionTypes = Object.keys(actions);
    if (actionTypes.indexOf(action) == -1) {
      return HttpUtil.badRequest(
        res,
        'Invalid action param. Value must be ' + actionTypes.join(','),
      );
    }
    let authUser = req.authUser;
    let cond = { actionType: actions[action], interactorId: authUser._id };
    if (action == 'like') {
      cond.actionType = { $ne: actions.nope };
    }

    let allowFilter = (req.query.allowFilter || 'true').toUpperCase() == 'TRUE';
    if (allowFilter) {
      let clientIds = await this.model.getInteractorIdsForAuthUser(authUser); // danh sách mình tương tác

      if (clientIds.length) {
        cond = { ...cond, agentId: { $nin: clientIds } }; // bỏ đi những bản ghi mình đã tương tác
      }
    }

    // TODO filters
    let options = this.handleFilter(req);
    let promises = [this.model.find(cond, options)];
    if (options.pageSize > 0 && options.currentPage > -1) {
      promises.push(this.model.getCount(cond));
    }
    let [err, rs] = await to(Promise.all(promises));
    if (err) return HttpUtil.internalServerError(res, err);

    let data = rs[0];
    let total = rs[1] || data.length;
    let lists = [];
    let updatedLists = [];
    if (data && data.length) {
      data.map(item => {
        lists.push(item.agentId);
      });
      [err, lists] = await to(this.getClients(lists, authUser));
      updatedLists = await Promise.all(
        lists.map(async element => {
          const clonedItem = Utils.cloneObject(element);
          let { ...obj } = clonedItem;

          const pipeline = [
            {
              $match: {
                userId: obj._id,
                'avatars.reviewerStatus': {
                  $exists: true,
                  $in: [0, 1, 2],
                },
              }, // Điều kiện userId
            },

            {
              $unwind: '$avatars',
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
          let resultImage = await this.mImage.execAggregate(pipeline);

          let resultPrompt = await this.mPromptAnswer.getByIdsUserId(
            element._id,
          );

          if (resultImage.length !== 0) {
            obj.profiles.avatars = [...resultImage[0].avatars];
          } else {
            obj.profiles.avatars = [];
          }
          if (resultPrompt) {
            obj.profiles.prompts = [...resultPrompt.promptAnswers];
          }

          return obj;
        }),
      );

      updatedLists = updatedLists.filter(x => x.profiles.avatars != 0);

      if (err) return HttpUtil.internalServerError(res, err);
    }

    let ret = DBUtil.paginationResult(
      updatedLists,
      updatedLists.length,
      options,
      req.query,
    );
    return HttpUtil.success(res, ret);
  }

  async getClients(clientIds, authUser) {
    let [err, lists] = await to(this.sClient.getClients(clientIds));
    if (err) throw Error(err.message || err);
    return this.sClient.handleResult(lists, authUser);
  }
}

module.exports = new Controller();
