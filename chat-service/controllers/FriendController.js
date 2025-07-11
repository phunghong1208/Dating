'use strict';

const to = require('await-to-js').default;
const DBUtil = require('../utils/Database');
const BaseController = require('../Base');
const Channel = require('../models/Channel');
const ServiceClient = require('../services/cards');
const Config = require('../config');
const Utils = require('../utils');
const Image = require('../models/Image');
const PromptAnswer = require('../models/PromptAnswer');
/* 
  Thống kê tương tác của người dùng
*/
class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.model = Channel;
    this.sClient = ServiceClient;
    this.mImage = Image;
    this.mPromptAnswer = PromptAnswer;
  }

  async index(req, res) {
    let [err, ret] = await to(this.getLists(req));
    console.log('ret', ret);
    if (err) return this.throwInternalError(res, err);
    return this.success(res, { data: ret });
  }

  async listsByNew(req, res) {
    let cond = { status: Config.statusOfChannel.pending };
    let [err, ret] = await to(this.getLists(req, cond));
    if (err) return this.throwInternalError(res, err);
    return this.success(res, { data: ret });
  }

  async getLists(req, cond) {
    if (!cond) cond = {};
    let authUser = req.authUser;
    cond = {
      ...cond,
      clientIds: authUser?._id,
      type: Config.typeOfChannel.couple,
      isMatched: true,
    };
    let options = this.handleFilter(req);
    let promises = [this.model.find(cond, options)];
    if (options.pageSize > 0 && options.currentPage > -1) {
      promises.push(this.model.getCount(cond));
    }
    let [err, rs] = await to(Promise.all(promises));
    if (err) return this.throwErr(err);
    if (!Array.isArray(rs)) {
      console.log('rs is not array:', rs);
      rs = [];
    }
    let data = Array.isArray(rs[0]) ? rs[0] : [];
    console.log('data', data);
    let total = typeof rs[1] === 'number' ? rs[1] : data.length;
    let lists = [],
      friendIds = [],
      objMapStatus = {},
      mapChannels = {};
    if (Array.isArray(data) && data.length) {
      data.map(item => {
        let { clientIds = [], status, channelId } = item || {};
        if (!Array.isArray(clientIds)) clientIds = [];
        clientIds.map(id => {
          if (id != authUser._id && friendIds.indexOf(id) == -1) {
            friendIds.push(id);
            objMapStatus[id] = status;
            mapChannels[id] = channelId;
          }
        });
      });
      let clientErr, clientLists;
      [clientErr, clientLists] = await to(this.sClient.getClients(friendIds));
      if (clientErr) return this.throwErr(clientErr);
      lists = Array.isArray(clientLists) ? clientLists : [];
      lists = await Promise.all(
        lists.map(async element => {
          if (!element) return null;
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
              },
            },
            { $unwind: '$avatars' },
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
                avatars: { $push: '$avatars' },
              },
            },
          ];
          let resultImage = await this.mImage.execAggregate(pipeline) || [];
          let resultPrompt = await this.mPromptAnswer.getByIdsUserId(element._id) || {};
          if (Array.isArray(resultImage) && resultImage.length !== 0) {
            obj.profiles.avatars = [...(resultImage[0].avatars || [])];
          } else {
            obj.profiles.avatars = [];
          }
          if (resultPrompt && Array.isArray(resultPrompt.promptAnswers)) {
            obj.profiles.prompts = [...resultPrompt.promptAnswers];
          } else {
            obj.profiles.prompts = [];
          }
          return obj;
        })
      );
      lists = lists.filter(x => x && Array.isArray(x.profiles.avatars) && x.profiles.avatars.length !== 0);
      lists = this.buildFriendResponse(
        lists,
        authUser,
        mapChannels,
        objMapStatus,
      );
    }
    return DBUtil.paginationResult(lists, total, options, req.query);
  }

  buildFriendResponse(lists, authUser, mapChannels, objMapStatus) {
    if (lists.length) {
      lists = lists.map(item => {
        item = Utils.cloneObject(item);
        let { location, ...obj } = item;
        if (location && authUser.location)
          obj.distanceKm = Utils.distanceInKm(authUser.location, location);
        if (mapChannels && mapChannels[item._id]) {
          obj.channelId = mapChannels[item._id];
        }
        if (objMapStatus) {
          obj.isNewFriend = !objMapStatus[item._id];
        }
        return obj;
      });
    }
    return lists;
  }
}

module.exports = new Controller();
