'use strict';

const to = require('await-to-js').default;
const BaseService = require('./Base');
const HttpUtil = require('../utils/http');
const Customer = require('../models/Customer');
const Interest = require('../models/Interest');
const CustomerClone = require('../models/CustomerClone');
const Image = require('../models/Image');
const PromptAnswer = require('../models/PromptAnswer');
const ImageClone = require('../models/ImageClone'); 
const staticServices = require('./static');

const Activity = require('../models/Activity');
const Topic = require('../models/Topic');
const Utils = require('../utils');
const { forEach } = require('lodash');
const { l } = require('../../utils/log');

class Service extends BaseService {
  constructor() {
    super(Service);
    this.model = Customer;
    this.mActivity = Activity;
    this.mTopic = Topic;
    this.customerClone = CustomerClone;
    this.imageModel = Image;
    this.mPromptAnswer = PromptAnswer;
    this.imageModelClone = ImageClone;
  }

  async getTopic(topicId) {
    let [err, rs] = await to(this.mTopic.getById(topicId));
    if (err) throw Error(err.message || err);
    if (!rs) return { error: { msg: 'Not_Exists.general', words: topicId } };
    return rs;
  }

  /**
   * Service xử lý join vào topic của user
   * @param {*} topicId
   * @param {*} authUser
   * @returns
   */
  async joinTopic(topicId, authUser) {
    let { explore } = authUser;
    if (!explore) explore = { verified: false };
    if (!explore.topics) explore.topics = [];

    if (explore.topics.indexOf(topicId) == -1) {
      explore.topics.push(topicId);
      authUser.explore = explore;
      await this.model.updateOne(authUser._id, { explore }, {}, authUser);
    }
    let resultImage = await this.imageModel.getByIdsUserId(authUser._id);

    let resultPrompt = await this.mPromptAnswer.getByIdsUserId(authUser._id);

    if (resultImage) {
      authUser.profiles.avatars = [...resultImage.avatars];
    }
    if (resultPrompt) {
      authUser.profiles.prompts = [...resultPrompt.promptAnswers];
    }
    return authUser;
  }

  async outTopic(topic, authUser) {
    let { explore } = authUser;
    if (
      !explore ||
      !explore.topics ||
      !explore.topics.length ||
      explore.topics.indexOf(topic._id) == -1
    ) {
      return this.throwErr(
        `User '${authUser.fullname}' has not joined topic '${topic.name}'`,
      );
    }
    authUser.explore.topics = authUser.explore.topics.filter(
      id => id != topic._id,
    );
    await this.model.updateOne(
      authUser._id,
      { 'explore.topics': authUser.explore.topics },
      {},
      authUser,
    );
    return authUser;
  }

  async getLists(options, authUser) {
    let [err, conditions] = await to(this.getCondition(authUser));
    if (err) throw Error(err.message || err);
    if (options.filter) {
      conditions = { ...conditions, ...options.filter };
      delete options.filter;
    }
    let lists = [];
    console.log("conditions", conditions);
    [err, lists] = await to(this.handleFilter(conditions, options, authUser));

    if (err) throw Error(err.message || err);
    return lists;
  }

  /**
   * Clone Data Image
   * @param {*} options
   * @param {*} authUser
   * @returns
   */
  async getListsCardClone(options, authUser) {
    let [err, conditions] = await to(this.getCondition(authUser));
    if (err) throw Error(err.message || err);
    if (options.filter) {
      conditions = { ...conditions, ...options.filter };
      delete options.filter;
    }
    // let lists = [];
    // [err, lists] = await to(this.handleFilter(conditions, options, authUser));

    let arrayList = [];

    // lists.forEach(async element => {
    //   const location = {
    //     location: { lat: '20.9794367', long: '105.7099217' },
    //   };
    //   let result = await this.model.updateOne(element._id, location);
    //   console.log(result);
    // });

    // lists.forEach(async element => {
    //   const findData = await this.imageModelClone.getByIdsUserId(element._id);

    //   if (!findData) {
    //     console.log(element);
    //     arrayList.push(element);
    //   }
    // });
    // console.log('lists', lists.length);
    // lists.forEach(async element => {
    //   let obj = {
    //     _id: element._id,
    //     oAuth2Id: element.oAuth2Id,
    //     fullname: element.fullname,
    //     phone: element.phone,
    //     dob: element.dob,
    //     metadata: {
    //       age: element.metadata?.age ? element.metadata?.age : 18,
    //     },
    //     profiles: {
    //       showCommon: {
    //         showSexual: element.profiles.showSexual,
    //         showGender: element.profiles.showGender,
    //         showAge: element.profiles.showAge,
    //         showDistance: element.profiles.showDistance,
    //       },
    //       about: element.profiles.about ? element.profiles.about : '',
    //       gender: element.profiles.gender,
    //       height: 160,
    //       school: element.profiles.school ? element.profiles.school : '',
    //       company: element.profiles.company ? element.profiles.company : '',
    //       jobTitle: element.profiles.jobTitle ? element.profiles.jobTitle : '',
    //       work: '',
    //       datingPurpose: element.profiles.datingPurpose
    //         ? element.profiles.datingPurpose
    //         : '',
    //       languages: element.profiles.languages
    //         ? element.profiles.languages
    //         : [],
    //       childrenPlan: element.profiles.childrenPlan
    //         ? element.profiles.childrenPlan
    //         : '',

    //       zodiac: element.profiles.zodiac ? element.profiles.zodiac : '',
    //       education: element.profiles.education
    //         ? element.profiles.education
    //         : '',
    //       familyPlan: element.profiles.familyPlan
    //         ? element.profiles.familyPlan
    //         : '',
    //       covidVaccine: element.profiles.covidVaccine
    //         ? element.profiles.covidVaccine
    //         : '',
    //       personality: element.profiles.personality,
    //       communicationType: element.profiles.communicationType
    //         ? element.profiles.communicationType
    //         : '',
    //       loveStyle: element.profiles.loveStyle
    //         ? element.profiles.loveStyle
    //         : '',
    //       pet: element.profiles.pet ? element.profiles.pet : '',
    //       drinking: element.profiles.drinking ? element.profiles.drinking : '',
    //       smoking: element.profiles.smoking ? element.profiles.smoking : '',
    //       workout: element.profiles.workout ? element.profiles.workout : '',
    //       dietaryPreference: element.profiles.dietaryPreference
    //         ? element.profiles.dietaryPreference
    //         : '',
    //       socialMedia: element.profiles.socialMedia
    //         ? element.profiles.socialMedia
    //         : '',
    //       sleepingHabit: element.profiles.sleepingHabit
    //         ? element.profiles.sleepingHabit
    //         : '',

    //       ethnicitys: element.profiles.ethnicitys
    //         ? element.profiles.ethnicitys
    //         : [],
    //       smartPhoto: false,
    //       drug: element.profiles.drug ? element.profiles.drug : '',

    //       favoriteSongs: [],
    //       address: '',
    //     },
    //     settings: {},
    //     explore: { topics: [] },
    //   };
    //   // const findData = await this.customerClone.find({
    //   //   oAuth2Id: element._id,
    //   // });
    //   // if (findData.length === 0) {
    //   let user = await to(this.customerClone.insertOne(obj));
    //   if (element.profiles.avatars && element.profiles.avatars?.length > 0) {
    //     // const newImageArr = [];
    //     let avatars = [];
    //     for (let i = 0; i < element.profiles.avatars.length; i++) {
    //       avatars.push({
    //         id: Utils.generateULID(),
    //         meta: {
    //           url: element.profiles.avatars[i]?.url,
    //           thumbnails: [element.profiles.avatars[i]?.url],
    //         },
    //         reviewerStatus: 0, // 0: pending / 1: accepted / 2: rejected
    //         order: i,
    //         comment: '',
    //         reviewerViolateOption: [],
    //         aiStatus: 0,
    //         aiViolateOption: [],
    //         aiPoint: 0,
    //         insert: {
    //           when: Date.now(),
    //           by: authUser ? authUser._id : undefined,
    //         },
    //       });
    //     }
    //     let newImageArr = {
    //       avatars: avatars,
    //       userId: element._id,
    //     };
    //     const [errImage, image] = await to(
    //       this.imageModelClone.insertObject(newImageArr),
    //     );

    //     if (errImage) {
    //       console.log('register insert image error', errImage);
    //     } else {
    //       console.log('image success');
    //     }
    //   }
    //   // }
    // });

    if (err) throw Error(err.message || err);
    return arrayList;
  }

  async getCondition(authUser) {
    let [err, interactors] = await to(
      this.mActivity.find({ agentId: authUser._id }),
    );
    if (err) throw Error(err.message || err);
    let arrNin = [authUser._id];
    if (interactors && interactors.length) {
      interactors.map(item => {
        arrNin.push(item.interactorId.toString());
      });
    }
    let conditions = { _id: { $nin: arrNin } };
    if (
      authUser.settings &&
      authUser.settings.genderFilter &&
      authUser.settings.genderFilter != 'all'
    ) {
      conditions['profiles.gender'] = authUser.settings.genderFilter;
    }
    return conditions;
  }

  async handleFilter(conds, opts, authUser) {
    let [err, lists] = await to(this.model.getByConditions(conds, opts));
    console.log("lists", lists);
    if (err) throw Error(err.message || err);
    return this.handleResult(lists, authUser);
  }

  handleResult(lists, authUser) {
    if (lists.length) {
      lists = lists.map(item => {
        item = Utils.cloneObject(item);
        let { location, ...obj } = item;
        if (location && authUser.location)
          obj.distanceKm = Utils.distanceInKm(authUser.location, location);
        return obj;
      });
    }
    return lists;
  }

  /**
   * Check exits interest
   * @param {*} arrayA
   * @param {*} arrayB
   * @returns
   */
  checkAllExist(interestsA, interestsB) {
    return interestsB.every(itemB => interestsA.some(itemA => itemA === itemB));
  }

  /**
   * Check location, interest khi lấy được list danh sách card
   * @param {*} lists
   * @param {*} params
   * @param {*} authUser
   * @returns
   */
  async handleFilterCard(lists, params, authUser) {
    let resultData = [];
    if (lists.length) {
      for (let index = 0; index < lists.length; index++) {
        const element = Utils.cloneObject(lists[index]);
        let { location, ...obj } = element;
        let resultImage = await this.imageModel.getByIdsUserId(element._id);
        let result = await this.checkAllExist(
          obj.profiles.interests,
          params.interests,
        );
        console.log('object', location);

        if (location && authUser.location) {
          obj.distanceKm = Utils.distanceInKm(authUser.location, location);
          // Kiểm tra location xem khoảng cách
          if (obj.distanceKm <= parseInt(params.distance)) {
            // resultData.push(obj);
            // Kiểm tra số lượng ảnh của user
            if (resultImage.avatars.length >= params.numberPhoto) {
              // resultData.push(obj);
              // Kiểm tra interest 
              // Nếu tồn tại
              if (params.interests.length !== 0) {
                // Tồn tại interest
                if (result) {
                  // resultData.push(obj);
                  if (params.statusVerified === true) {
                    if (obj.explore.verified === 2) {
                      // resultData.push(obj);

                      if (params.statusBio === true) {
                        if (obj.profiles.about.length !== 0) {
                          resultData.push(obj);
                        }
                      } else {
                        resultData.push(obj);
                      }
                    }
                  } else {
                    if (params.statusBio === true) {
                      if (obj.profiles.about.length !== 0) {
                        resultData.push(obj);
                      }
                    } else {
                      resultData.push(obj);
                    }
                  }
                }
              } else {
                // resultData.push(obj);
                // mặc định interest =[]
                // Kiểm tra statusVerified = true
                if (params.statusVerified === true) {
                  if (obj.explore.verified === 2) {
                    // resultData.push(obj);
                    if (params.statusBio === true) {
                      if (obj.profiles.about.length !== 0) {
                        resultData.push(obj);
                      }
                    } else {
                      resultData.push(obj);
                    }
                  }
                } else {
                  // Mặc định statusVerified = false
                  // Kiểm tra tiếp đến Bio
                  if (params.statusBio === true) {
                    if (obj.profiles.about.length !== 0) {
                      resultData.push(obj);
                    }
                  } else {
                    // Fasle: lấy mặc định
                    resultData.push(obj);
                  }
                }
              }
            }
          }
        }
      }
      // lists = lists.map(async item => {
      //   item = Utils.cloneObject(item);
      //   let { location, ...obj } = item;
      //   console.log(location);
      //   let resultImage = await this.imageModel.getByIdsUserId(item._id);
      //   // let result = await this.checkAllExist(
      //   //   obj.profiles.interests,
      //   //   params.interests,
      //   // );
      //   // Check khoảng cách
      //   // if (location && authUser.location) {
      //   //   obj.distanceKm = Utils.distanceInKm(authUser.location, location);

      //   //   if (obj.distanceKm <= parseInt(params.distance)) {
      //   //     resultData.push(obj);
      //   //     console.log('vao');
      //   //     // console.log('resultData', resultData);

      //   //     // if (resultImage) {
      //   //     //   obj.profiles.avatars = [...resultImage.avatars];
      //   //     // }
      //   //     // console.log('resultImage', resultImage);
      //   //     // if (resultImage.avatars.length > params.numberPhoto) {
      //   //     //   console.log('Vao', obj);
      //   //     //   // resultData.push(obj);
      //   //     //   console.log('resultData', resultData.length);
      //   //     // }
      //   //   }
      //   // }

      //   // if (resultImage) {
      //   //   obj.profiles.avatars = [...resultImage.avatars];
      //   // }
      //   // if (resultImage.avatars.length > params.numberPhoto) {
      //   //   const findData = resultData.find(x => x._id === obj._id);
      //   //   if (!findData) resultData.push(obj);
      //   // }
      //   // if (params.interests.length !== 0) {
      //   //   if (result) {
      //   //     const findData = resultData.find(x => x._id === obj._id);
      //   //     if (!findData) resultData.push(obj);
      //   //   }
      //   // }
      //   // // Kiểm tra thêm statusVerified=true
      //   // if ((params.statusVerified = true)) {
      //   //   if (item.explore.verified === true) {
      //   //     const findData = resultData.find(x => x._id === obj._id);
      //   //     if (!findData) resultData.push(obj);
      //   //   }
      //   // }
      //   // // Kiểm tra thêm statusBio
      //   // if ((params.statusBio = true)) {
      //   //   if (item.profiles.about.length !== 0) {
      //   //     const findData = resultData.find(x => x._id === obj._id);
      //   //     if (!findData) resultData.push(obj);
      //   //   }
      //   // }

      //   return obj;
      // });
    }
    console.log('resultData', resultData);
    return resultData;
  }

  async getClients(clientIds) {
    return this.model.getClients(clientIds);
  }

  async getCardByFilter(clientIds, params, authUser) {
    let [err, lists] = await to(this.model.getCardByFilter(clientIds, params));

    console.log('lists-dob', lists.length);
    if (err) throw Error(err.message || err);
    let resultData = this.handleFilterCard(lists, params, authUser);
    return resultData;
  }

  async getClientProfile(clientId, authUser) {
    return this.model.getClientProfile(clientId);
  }
}

module.exports = new Service();
