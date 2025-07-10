'use strict';

const to = require('await-to-js').default;
const BaseController = require('./BaseController');
const Model = require('../models/Customer');
const mImage = require('../models/Image');
const PromptAnswer = require('../models/PromptAnswer');

const Utils = require('../utils');
const HttpUtil = require('../utils/http');

/*
  Xem hàm mẫu BaseController nếu muốn viết lại các action
*/
class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.model = Model;
    this.mImage = mImage;
    this.mPromptAnswer = PromptAnswer;
    this.selection = {};
  }

  async load(req, res, next, id) {
    return super.load(req, res, next, id);
  }

  async index(req, res) {
    return super.index(req, res);
  }

  detail(req, res) {
    return super.detail(req, res);
  }

  async destroy(req, res) {
    return super.destroy(req, res);
  }

  async lock(req, res) {
    return this.handleAcc(req, res, { action: 'lock' });
  }

  async unlock(req, res) {
    return this.handleAcc(req, res, { action: 'unlock', disable: false });
  }

  async getDetailCustomer(req, res) {
    let params = this.checkRequiredParams2(req.params, ['cusId']);
    if (params.error) return this.throwBadRequest(res, params.error);

    let [err, user] = await to(this.model.getById(params.cusId));
    if (err) return this.throwInternalError(res, msg.error || err);
    const clonedItem = Utils.cloneObject(user);
    let { ...obj } = clonedItem;
    if (user) {
      const resultImage = await this.mImage.getByIdsUserId(obj._id);
      const resultPrompt = await this.mPromptAnswer.getByIdsUserId(obj._id);

      if (resultPrompt) {
        obj.profiles.prompts = [...resultPrompt.promptAnswers];
      }
      if (resultImage) {
        obj.profiles.avatars = [...resultImage.avatars];
      }
    }
    return HttpUtil.success(res, obj);
  }

  async handleAcc(req, res, options = {}) {
    let params = this.checkRequiredParams2(req.params, ['cusId']);
    if (params.error) return this.throwBadRequest(res, params.error);

    let [err, user] = await to(this.model.load(params.cusId));
    if (!user || user.delete) {
      return this.throwUnprocessable(res, {
        msg: 'Not_Exists.user',
        words: params.cusId,
      });
    }
    let { disable = true } = options;
    [err, user] = await to(this.model.updateOne(user._id, { disable }));
    if (err) return this.throwInternalError(res, msg.error || err);

    return this.success(res, 'Success.general');
  }

  async getListCardCustomer(req, res) {
    let params = this.getRequiredParams2(req, []);

    if (params.error) return this.throwBadRequest(res, params.error);
    let options = await this.handleFilter(req);
    let [err, rs] = await to(
      this.model.getListModelCardCustomer(options, params),
    );

    let updatedLists = [];
    if (rs.list_data.length) {
      updatedLists = await Promise.all(
        rs.list_data.map(async item => {
          const clonedItem = Utils.cloneObject(item);
          let { ...obj } = clonedItem;

          const resultImage = await this.mImage.getByIdsUserId(obj._id);
          const resultPrompt = await this.mPromptAnswer.getByIdsUserId(obj._id);

          if (resultPrompt) {
            obj.profiles.prompts = [...resultPrompt.promptAnswers];
          }
          if (resultImage) {
            obj.profiles.avatars = [...resultImage.avatars];
          }

          return obj;
        }),
      );
    }
    rs.list_data = [...updatedLists];

    if (err)
      return this.throwInternalError(res, {
        msg: 'Errors.Load_Lists_Failed',
        words: err.message,
      });
    return this.success(res, { data: rs });
  }

  async insertManyAvatarByUserId(req, res) {
    let options = await this.handleFilterCared(req);

    let [err, lists] = await to(this.model.getListCustomer(options));

    if (err) return this.throwInternalError(res, msg.error || err);

    for (let index = 0; index < lists.length; index++) {
      const element = lists[index];
      const newImageArr = [];

      for (let index = 0; index < 4; index++) {
        newImageArr.push({
          id: Utils.generateULID(),
          meta: {
            url: '',
            thumbnails: ['https://bachasoft'],
          },
          reviewerStatus: 0, // 0: pending / 1: accepted / 2: rejected
          order: index,
          comment: '',
          reviewerViolateOption: [],
          aiStatus: 0,
          isVerified: false,
          aiViolateOption: [],
          aiPoint: 0,
          insert: {
            when: Date.now(),
          },
        });
      }
      const objImage = {
        avatars: newImageArr,
        userId: element._id,
      };
      const [errImage, image] = await to(this.mImage.insertObject(objImage));
    }
    return this.success(res, 'Success.general');
  }

  /**
   * Tool upload thumbnail
   * @param {*} req
   * @param {*} res
   * @returns
   */
  async postImageThumbnail(req, res) {
    let options = await this.handleFilterCared(req);

    let listAvatar = req.body.listImage;
    let [err, lists] = await to(this.mImage.getListImage(options));
    if (err) return this.throwInternalError(res, msg.error || err);
    let listData = [];

    const batchSize = 10; // Số lượng yêu cầu trong mỗi lô
    const totalAvatars = lists.reduce(
      (acc, element) => acc + element.avatars.length,
      0,
    ); // Tính tổng số lượng avatar

    for (let i = 0; i < totalAvatars; i += batchSize) {
      const batch = lists.slice(i, i + batchSize); // Chia nhỏ mảng thành các lô
      const promises = [];

      for (const element of batch) {
        for (const avatar of element.avatars) {
          const elementImage = listAvatar.shift();
          if (elementImage) {
            const params = {
              avatarId: avatar.id,
              meta: elementImage,
            };

            promises.push(this.mImage.updateAvatarUrl(params)); // Thêm promise vào mảng
          } else {
            return this.success(res, { data: listData });
          }
        }

        listData.push(element);
      }

      // for (const element of batch) {
      //   for (const avatar of element.avatars) {
      //     const elementImage = listAvatar[0];
      //     if (elementImage) {
      //       const params = {
      //         avatarId: avatar.id,
      //         meta: elementImage,
      //       };

      //       promises.push(this.mImage.updateAvatarUrl(params)); // Thêm promise vào mảng
      //     }
      //   }
      // }

      try {
        // Gửi yêu cầu trong lô và đợi cho tất cả các promise hoàn thành
        await Promise.all(promises);
      } catch (error) {
        // Xử lý lỗi
        console.error('Error occurred while processing batch:', error);
      }
    }
    [err, lists] = await to(this.mImage.getListImage(options));
    if (err) return this.throwInternalError(res, msg.error || err);

    return this.success(res, { data: listData });
  }

  async deleteImageThumbnail(req, res) {
    let options = await this.handleFilterCared(req);

    let [err, lists] = await to(this.model.getListCustomer(options));
    // let [err, lists] = await to(this.mImage.getListImage(options));

    if (err) return this.throwInternalError(res, msg.error || err);

    let listId = [];
    for (let index = 0; index < lists.length; index++) {
      const element = lists[index];

      listId.push(element._id);
    }

    // const existingIds = await this.mImage.find({
    //   userId: { $in: listId },
    //   avatars: {
    //     $elemMatch: {
    //       'meta.url': '',
    //     },
    //   },
    // });
    // let imgeNew = [];
    // for (let index = 0; index < existingIds.length; index++) {
    //   const element = existingIds[index];
    //   imgeNew.push(element.userId);
    // }

    // console.log('existingIds', existingIds.length);

    // await this.mImage.deleteMany({
    //   userId: { $in: listId },
    //   avatars: {
    //     $elemMatch: {
    //       'meta.url': '',
    //     },
    //   },
    // });
    // await this.mImage.deleteMany({ userId: { $in: imgeNew } });
    await this.model.updateManyArray(
      {
        _id: { $in: listId },
      },
      { $unset: { metadata: '' } },
    );
    return this.success(res, { data: listId });
  }

  async postImageThumbnailAI(req, res) {
    let options = await this.handleFilterCared(req);

    let [err, lists] = await to(this.mImage.getListImage(options));
    if (err) return this.throwInternalError(res, msg.error || err);

    const batchSize = 10; // Số lượng yêu cầu trong mỗi lô
    const totalAvatars = lists.reduce(
      (acc, element) => acc + element.avatars.length,
      0,
    ); // Tính tổng số lượng avatar

    for (let i = 0; i < totalAvatars; i += batchSize) {
      const batch = lists.slice(i, i + batchSize); // Chia nhỏ mảng thành các lô
      const promises = [];

      for (const element of batch) {
        for (const avatar of element.avatars) {
          const params = {
            avatarId: avatar.id,
          };
          promises.push(this.mImage.updateAvatarUrl(params)); // Thêm promise vào mảng
        }
      }

      try {
        // Gửi yêu cầu trong lô và đợi cho tất cả các promise hoàn thành
        await Promise.all(promises);
      } catch (error) {
        // Xử lý lỗi
        console.error('Error occurred while processing batch:', error);
      }
    }
    [err, lists] = await to(this.mImage.getListImage(options));
    if (err) return this.throwInternalError(res, msg.error || err);
    return this.success(res, { data: lists });
  }

  async postInformationCustomer(req, res) {
    let params = this.getRequiredParams2(req);

    if (params.error) return this.throwBadRequest(res, params.error);
    let options = await this.handleFilterCared(req);

    let [err, lists] = await to(this.model.getListCustomer(options));
    if (err) return this.throwInternalError(res, msg.error || err);
    let promises = [];
    for (let index = 0; index < lists.length; index++) {
      let profile = {
        showCommon: {
          showSexual: true,
          showGender: true,
          showAge: true,
          showHeight: true,
          showEthnicity: true,
          showChildrenPlan: true,
          showFamilyPlan: true,
          showWork: true,
          showSchool: true,
          showEducation: true,
          showDrinking: true,
          showSmoking: true,
          showDrug: true,
          showDistance: true,
        },
        about: '',
        interests: [],
        orientationSexuals: [],
        languages: [],
        ethnicitys: [],
        height: 0,
        school: '',
        company: '',
        jobTitle: '',
        address: '',
        datingPurpose: '',
        childrenPlan: '',
        zodiac: '',
        education: '',
        familyPlan: '',
        covidVaccine: '',
        personality: '',
        communicationType: '',
        loveStyle: '',
        pet: '',
        drinking: '',
        smoking: '',
        workout: '',
        dietaryPreference: '',
        socialMedia: '',
        sleepingHabit: '',
        drug: '',
      };
      const element = lists[index];

      // Random giá trị
      const randomAbout = Math.floor(Math.random() * params.abouts.length);
      const randomInterest = Math.floor(
        Math.random() * params.interests.length,
      );
      const randomOrientationSexuals = Math.floor(
        Math.random() * params.orientationSexuals.length,
      );
      const randomLanguages = Math.floor(
        Math.random() * params.languages.length,
      );
      const randomEthnicitys = Math.floor(
        Math.random() * params.ethnicitys.length,
      );
      const randomAddress = Math.floor(Math.random() * params.address.length);
      const randomJobTitle = Math.floor(
        Math.random() * params.jobTitles.length,
      );

      const randomSchools = Math.floor(Math.random() * params.schools.length);
      const randomHeights = Math.floor(Math.random() * params.heights.length);
      const randomChildrenPlans = Math.floor(
        Math.random() * params.childrenPlans.length,
      );
      const randomFamilyPlans = Math.floor(
        Math.random() * params.familyPlans.length,
      );
      const randomCompanys = Math.floor(Math.random() * params.companys.length);
      const randomDrugs = Math.floor(Math.random() * params.drugs.length);
      const randomDatingPurposes = Math.floor(
        Math.random() * params.datingPurposes.length,
      );
      const randomZodiacs = Math.floor(Math.random() * params.zodiacs.length);
      const randomEducations = Math.floor(
        Math.random() * params.educations.length,
      );
      const randomCovidVaccines = Math.floor(
        Math.random() * params.covidVaccines.length,
      );
      const randomPersonalitys = Math.floor(
        Math.random() * params.personalitys.length,
      );
      const randomCommunicationTypes = Math.floor(
        Math.random() * params.communicationTypes.length,
      );
      const randomLoveStyle = Math.floor(
        Math.random() * params.loveStyles.length,
      );
      const randomPets = Math.floor(Math.random() * params.pets.length);
      const randomDrinking = Math.floor(
        Math.random() * params.drinkings.length,
      );
      const randomSmoking = Math.floor(Math.random() * params.smokings.length);
      const randomWorkout = Math.floor(Math.random() * params.workouts.length);
      const randomDietaryPreference = Math.floor(
        Math.random() * params.dietaryPreferences.length,
      );
      const randomSocialMedia = Math.floor(
        Math.random() * params.socialMedias.length,
      );
      const randomSleepingHabit = Math.floor(
        Math.random() * params.sleepingHabits.length,
      );

      // Lấy data
      const objectAbout = params.abouts[randomAbout];
      const objectInterest = params.interests[randomInterest];
      const objectOrientationSexual =
        params.orientationSexuals[randomOrientationSexuals];
      const objectLanguage = params.languages[randomLanguages];
      const objectEthnicity = params.ethnicitys[randomEthnicitys];
      const objectAddress = params.address[randomAddress];
      const objectSchool = params.schools[randomSchools];
      const objectJobTitle = params.schools[randomJobTitle];
      const objectHeight = params.heights[randomHeights];
      const objectChildrenPlan = params.childrenPlans[randomChildrenPlans];
      const objectFamilyPlan = params.familyPlans[randomFamilyPlans];
      const objectCompany = params.companys[randomCompanys];
      const objectDrug = params.drugs[randomDrugs];
      const objectDatingPurposes = params.datingPurposes[randomDatingPurposes];
      const objectZodiac = params.zodiacs[randomZodiacs];
      const objectEducation = params.educations[randomEducations];
      const objectCovidVaccine = params.covidVaccines[randomCovidVaccines];
      const objectPersonality = params.personalitys[randomPersonalitys];
      const objectCommunicationType =
        params.communicationTypes[randomCommunicationTypes];
      const objectLoveStyle = params.loveStyles[randomLoveStyle];
      const objectPet = params.pets[randomPets];
      const objectDrinking = params.drinkings[randomDrinking];
      const objectSmoking = params.smokings[randomSmoking];
      const objectWorkout = params.workouts[randomWorkout];
      const objectDietaryPreference =
        params.dietaryPreferences[randomDietaryPreference];
      const objectSocialMedia = params.socialMedias[randomSocialMedia];
      const objectSleepingHabit = params.sleepingHabits[randomSleepingHabit];
      // Gán data
      profile.about = objectAbout;
      profile.interests.push(objectInterest);
      profile.orientationSexuals.push(objectOrientationSexual);
      profile.languages.push(objectLanguage);
      profile.ethnicitys.push(objectEthnicity);
      profile.address = objectAddress;
      profile.jobTitle = objectJobTitle;
      profile.school = objectSchool;
      profile.height = objectHeight;
      profile.childrenPlan = objectChildrenPlan;
      profile.familyPlan = objectFamilyPlan;
      profile.company = objectCompany;
      profile.drug = objectDrug;
      profile.datingPurpose = objectDatingPurposes;
      profile.zodiac = objectZodiac;
      profile.education = objectEducation;
      profile.covidVaccine = objectCovidVaccine;
      profile.personality = objectPersonality;
      profile.communicationType = objectCommunicationType;
      profile.loveStyle = objectLoveStyle;
      profile.pet = objectPet;
      profile.drinking = objectDrinking;
      profile.smoking = objectSmoking;
      profile.workout = objectWorkout;
      profile.socialMedia = objectSocialMedia;
      profile.dietaryPreference = objectDietaryPreference;
      profile.sleepingHabit = objectSleepingHabit;

      let profiles = { ...element.profiles, ...profile };

      let promise = this.model.updateOne(
        element._id,
        { profiles: profiles },
        {},
      );
      promises.push(promise);

      // await this.model.updateCustomerUrl(element, interests);
    }
    try {
      // Chờ tất cả các promise hoàn thành
      let results = await Promise.all(promises);
      return this.success(res, { data: lists });
    } catch (error) {
      // Xử lý lỗi nếu có
      return HttpUtil.internalServerError(res, {
        msg: 'Errors.update',
        words: error.message,
      });
    }
  }

  async postCommonCustomer(req, res) {
    let options = await this.handleFilterCared(req);

    let [err, lists] = await to(this.model.getListCustomer(options));
    if (err) return this.throwInternalError(res, msg.error || err);


    for (let index = 0; index < lists.length; index++) {
      const element = lists[index];
      this.model.updateCustomerUrl(element);
    }

    return this.success(res, { data: lists });
  }
}

module.exports = new Controller();
