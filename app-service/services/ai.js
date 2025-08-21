'use strict';

const axios = require('axios');
const to = require('await-to-js').default;
const FormData = require('form-data');
const BaseService = require('./Base');
const Customer = require('../models/Customer');
const Images = require('../models/Image');
const PromptAnswer = require('../models/PromptAnswer');

const Utils = require('../utils');
const {
  AI_HOST,
  AI_PORT,
  API_VERIFY_FACEID,
  RECOMMEND_HOST,
  RECOMMEND_PORT,
  API_LIST_RECOMMEND,
  API_LIST_EXPLORE,
  API_LIST_VERIFIED,
} = require('../config/ai.json');
const { forEach } = require('lodash');

const aiHost = AI_PORT ? `${AI_HOST}:${AI_PORT}` : AI_HOST;
const recomendHost = RECOMMEND_PORT
  ? `${RECOMMEND_HOST}:${RECOMMEND_PORT}`
  : RECOMMEND_HOST;

class Service extends BaseService {
  constructor() {
    super(Service);
    this.model = Customer;
    this.modelImage = Images;
    this.modelPrompt = PromptAnswer;
    this.urlRecommend = this.getApiRecommends();
    this.urlVerifyFaceID = this.getApiVerifyFaceID();
    this.urlListExplore = this.getApiListExplore();
    this.urlListVerified = this.getApiListVerified();
  }

  getApiRecommends() {
    return [recomendHost, API_LIST_RECOMMEND].join('/');
  }

  getApiListExplore() {
    return [recomendHost, API_LIST_EXPLORE].join('/');
  }

  getApiListVerified() {
    return [recomendHost, API_LIST_VERIFIED].join('/');
  }

  getApiVerifyFaceID() {
    return [aiHost, API_VERIFY_FACEID].join('/');
  }

  async fetchApi(url, data) {
    // let headers = { "Content-Type": "application/json" };
    return await axios({
      method: 'POST',
      url,
      data,
    });
  }
  timeoutPromise = timeout => {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), timeout),
    );
  };
  async fetchWithTimeout(fetchPromise, timeout) {
    return Promise.race([fetchPromise, this.timeoutPromise(timeout)]);
  }

  async getRecommends(options, authUser) {
    const form = new FormData();
    form.append('uid', authUser._id);
    form.append('limit', options.pageSize);

    let [err, rs] = await to(
      this.fetchWithTimeout(this.fetchApi(this.urlRecommend, form), 70000),
    );
    if (err) throw new Error(err.message || err);

    // let [err, rs] = await to(this.fetchApi(this.urlRecommend, form));
    // if (err) throw Error(err.message || err);
    let { status, statusText, data } = rs;
    if (status != axios.HttpStatusCode.Ok) {
      throw Error(statusText || status);
    }
    console.log('Data-AI-Recomment', data);
    if (data && data.length) {
      let lists = [];
      let conditions = { _id: { $in: data } };
      if (options.filter) {
        conditions = { ...conditions, ...options.filter };
        delete options.filter;
      }
      [err, lists] = await to(this.handleFilter(conditions, options, authUser));

      if (err) throw Error(err.message || err);
      return lists;
    }
    return data;
  }

  async getListsExplore(options, authUser, topicid) {
    const form = new FormData();
    form.append('uid', authUser._id);
    form.append('topicid', topicid);
    form.append('limit', options.pageSize);
    let [err, rs] = await to(this.fetchApi(this.urlListExplore, form));

    if (err) throw Error(err.message || err);
    let { status, statusText, data } = rs;
    console.log('Data-AI-Explore', rs.data);

    if (status != axios.HttpStatusCode.Ok) {
      throw Error(statusText || status);
    }
    if (data && data.length) {
      let lists = [];
      let conditions = { _id: { $in: data } };
      if (options.filter) {
        conditions = { ...conditions, ...options.filter };
        delete options.filter;
      }
      [err, lists] = await to(this.handleFilter(conditions, options, authUser));
      if (err) throw Error(err.message || err);
      return lists;
    }
    return data;
  }

  async getListVerified(options, authUser) {
    const form = new FormData();
    form.append('uid', authUser._id);
    form.append('limit', options.pageSize || -1);
    let [err, rs] = await to(this.fetchApi(this.urlListVerified, form));
    if (err) throw Error(err.message || err);
    let { status, statusText, data } = rs;
    if (status != axios.HttpStatusCode.Ok) {
      throw Error(statusText || status);
    }
    if (data && data.length) {
      let lists = [];
      let conditions = { _id: { $in: data } };
      if (options.filter) {
        conditions = { ...conditions, ...options.filter };
        delete options.filter;
      }
      [err, lists] = await to(this.handleFilter(conditions, options, authUser));
      if (err) throw Error(err.message || err);
      return lists;
    }
    return data;
  }

  /**
   * Get data customer map image vs prompts
   * @param {*} conds
   * @param {*} opts
   * @param {*} authUser
   * @returns
   */
  async handleFilter(conds, opts, authUser) {
    let [err, lists] = await to(this.model.getByConditions(conds, opts));

    if (err) throw Error(err.message || err);
    let updatedLists = await this.processRequests(lists, authUser);

    // let updatedLists = [];
    // if (lists.length) {
    //   updatedLists = await Promise.all(
    //     lists.map(async item => {
    //       const clonedItem = Utils.cloneObject(item);
    //       let { location, ...obj } = clonedItem;

    //       if (location && authUser.location) {
    //         const pipeline = [
    //           {
    //             $match: {
    //               userId: obj._id,
    //               'avatars.reviewerStatus': {
    //                 $exists: true,
    //                 $in: [0, 1, 2],
    //               },
    //             }, // Điều kiện userId
    //           },

    //           {
    //             $unwind: '$avatars',
    //           },
    //           {
    //             $match: {
    //               'avatars.reviewerStatus': {
    //                 $exists: true,
    //                 $in: [1],
    //               },
    //             },
    //           },
    //           {
    //             $group: {
    //               _id: '$_id',
    //               avatars: { $push: '$avatars' }, // Gom các avatar vào một mảng mới
    //             },
    //           },
    //         ];
    //         // let resultImage = await this.modelImage.getGroupImages(obj._id);

    //         let resultImage = await this.modelImage.execAggregate(pipeline);

    //         const resultPrompt = await this.modelPrompt.getByIdsUserId(obj._id);

    //         if (resultPrompt) {
    //           obj.profiles.prompts = [...resultPrompt.promptAnswers];
    //         }
    //         if (resultImage.length !== 0) {
    //           obj.profiles.avatars = [...resultImage[0].avatars];
    //         }
    //         // if (resultImage) {
    //         //   obj.profiles.avatars = [...resultImage.avatars];
    //         // }
    //       }

    //       obj.distanceKm = Utils.distanceInKm(authUser.location, location);

    //       return obj;
    //     }),
    //   );
    // }
    return updatedLists;
  }
  async asyncHandler(item, authUser) {
    const MAX_RETRIES = 3;

    const clonedItem = Utils.cloneObject(item);
    const { location, ...obj } = clonedItem;

    if (location && authUser.location) {
      const pipeline = [
        {
          $match: {
            userId: obj._id,
            'avatars.reviewerStatus': { $exists: true, $in: [0, 1, 2] },
          },
        },
        { $unwind: '$avatars' },
        {
          $match: { 'avatars.reviewerStatus': 1 },
        },
        {
          $group: {
            _id: '$_id',
            avatars: { $push: '$avatars' },
          },
        },
      ];

      let resultImage = [];
      let resultPrompt = null;
      let attempts = 0;

      while (attempts < MAX_RETRIES) {
        try {
          [resultImage, resultPrompt] = await Promise.all([
            this.modelImage.execAggregate(pipeline),
            this.modelPrompt.getByIdsUserId(obj._id),
          ]);
          break;
        } catch (error) {
          attempts++;
          console.error(
            `Attempt ${attempts} failed for item ${obj._id}:`,
            error,
          );
          if (attempts >= MAX_RETRIES) {
            throw error;
          }
        }
      }

      if (resultPrompt) {
        obj.profiles.prompts = resultPrompt.promptAnswers;
      }
      if (resultImage.length > 0) {
        obj.profiles.avatars = resultImage[0].avatars;
      }
    }

    obj.distanceKm = Utils.distanceInKm(authUser.location, location);

    return obj;
  }

  async processRequests(lists, authUser) {
    const updatedLists = [];
    const BATCH_SIZE = 100;

    for (let i = 0; i < lists.length; i += BATCH_SIZE) {
      const batch = lists.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(item => this.asyncHandler(item, authUser)),
      );

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          updatedLists.push(result.value);
        } else {
          console.error('Failed to process item:', result.reason);
        }
      });
    }

    return updatedLists;
  }

  async verifyFaceID(images, authUser) {
    let form = new FormData();
    form.append('uid', authUser._id);
    form.append('image', JSON.stringify(images));

    let [error, resultData] = await to(this.model.getClients(authUser._id));

    // console.log('resultData', resultData);
    if (resultData.length !== 0) {
      let verified = resultData[0].explore.verified;
      if (verified === 0 || verified === -1) {
        let [err, rs] = await to(this.fetchApi(this.urlVerifyFaceID, form));

        if (err) throw Error(err.message || err);
        let { status, statusText, data } = rs;
        if (status != axios.HttpStatusCode.Ok) {
          throw Error(statusText || status);
        }

        if (data === true) {
          let result = await this.model.updateItem(
            { _id: authUser._id },
            {
              $set: {
                'explore.verified': 1,
              },
            },
          );
          console.log('result', result);
        } else {
          let result = await this.model.updateItem(
            { _id: authUser._id },
            {
              $set: {
                'explore.verified': -1,
              },
            },
          );
          console.log('result', result);
        }
        console.log('data', data);
        if (!data) console.log('verifyFaceID response', data);
        return data;
      } else {
        // Đang xử lý
        return '201';
      }
    } else {
      // Không tồn tại user đó
      return '401';
    }
  }
}

module.exports = new Service();
