const BaseController = require('./BaseController');
const CustomerUser = require('../models/CustomerUser');
const Customer = require('../models/Customer');
const CustomerClone = require('../models/CustomerClone');
const Image = require('../models/Image');
const PromptAnswer = require('../models/PromptAnswer');
const ImageUser = require('../models/ImageUser');
const Utils = require('../../utils/index');
const to = require('await-to-js').default;

class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.mCustomerUser = CustomerUser;
    this.mCustomer = Customer;
    this.mCustomerClone = CustomerClone;
    this.mImage = Image;
    this.mImageUser = ImageUser;
    this.mPromptAnswer = PromptAnswer;
    this.selection = {};
  }

  async load(req, res, next, id) {
    return super.load(req, res, next, id);
  }

  async getListCardCustomerUser(req, res) {
    let options = await this.handleFilterCared(req);
    let [err, lists] = await to(
      this.mCustomerUser.getListCustomerUser(options),
    );

    if (err) return this.throwInternalError(res, msg.error || err);
    return this.success(res, { data: lists });
  }

  async deletePropertyCustomerUser(req, res) {
    let options = await this.handleFilterCared(req);

    let [err, lists] = await to(
      this.mCustomerUser.getListCustomerUser(options),
    );

    let listId = [];
    for (let index = 0; index < lists.length; index++) {
      const element = lists[index];

      listId.push(element._id);
    }
    await this.mCustomerUser.updateManyArray(
      {
        _id: { $in: listId },
      },
      { $unset: { metadata: '' } },
    );
    return this.success(res, { data: listId });
  }

  async postInformationCustomerUser(req, res) {
    let params = this.getRequiredParams2(req);

    if (params.error) return this.throwBadRequest(res, params.error);
    let options = await this.handleFilterCared(req);

    let [err, lists] = await to(
      this.mCustomerUser.getListCustomerUser(options),
    );
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

      let promise = this.mCustomerUser.updateOne(
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

  async postCommonCustomerUser(req, res) {
    let options = await this.handleFilterCared(req);

    let [err, lists] = await to(
      this.mCustomerUser.getListCustomerUser(options),
    );
    if (err) return this.throwInternalError(res, msg.error || err);

    let locations = req.body.locations;

    for (let index = 0; index < lists.length; index++) {
      const element = lists[index];
      const elementDob = locations.shift();
      this.mCustomerUser.updateCustomeUserCommon(element, elementDob);
    }

    return this.success(res, { data: lists });
  }

  async postManyAvatarByUserId(req, res) {
    let options = await this.handleFilterCared(req);

    let [err, lists] = await to(
      this.mCustomerUser.getListCustomerUser(options),
    );

    if (err) return this.throwInternalError(res, msg.error || err);

    for (let index = 0; index < lists.length; index++) {
      const element = lists[index];
      const newImageArr = [];

      for (let index = 0; index < 3; index++) {
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
      const [errImage, image] = await to(
        this.mImageUser.insertObject(objImage),
      );
    }
    return this.success(res, 'Success.general');
  }

  async importDataCustomerAndImage(req, res) {
    let options = await this.handleFilterCared(req);

    let [err, lists] = await to(
      this.mCustomerUser.getListCustomerUser(options),
    );


    if (err) return this.throwInternalError(res, msg.error || err);

    for (let index = 0; index < lists.length; index++) {
      const element = lists[index];

      const [errImage, findData] = await to(
        this.mCustomer.getByIds(element._id),
      );

      let obj = {
        _id: element._id,
        oAuth2Id: element.oAuth2Id,
        fullname: element.fullname,
        email: element.email,
        phone: element.phone,
        dob: element.dob,
        location: element.location,
        profiles: element.profiles,
        settings: {},
        explore: { topics: [] },
        packages: {},
      };

      if (findData.length === 0) {
        let [err, resultCustomer] = await to(
          this.mCustomerClone.insertObject(obj),
        );
        if (err) {
          console.log('register insert customer error', err);
        } else {
          console.log('customer success');
        }
      }
    }

    return this.success(res, 'Success.general');
  }
}

module.exports = new Controller();
