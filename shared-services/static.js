'use strict';

const to = require('await-to-js').default;
const BaseService = require('./Base');
const Area = require('../shared-models/Area');
const CommunicationStyle = require('../shared-models/CommunicationStyle');
const CovidVaccine = require('../shared-models/CovidVaccine');
const DatingPurpose = require('../shared-models/DatingPurpose');
const Drinking = require('../shared-models/Drinking');
const Education = require('../shared-models/Education');
const FamilyPlan = require('../shared-models/FamilyPlan');
const FoodPreference = require('../shared-models/FoodPreference');
const Gender = require('../shared-models/Gender');
const GenderFilter = require('../shared-models/GenderFilter');
const Interest = require('../shared-models/Interest');
const JobTitle = require('../shared-models/JobTitle');
const Language = require('../shared-models/Language');
const LoveStyle = require('../shared-models/LoveStyle');
const Personality = require('../shared-models/Personality');
const Pet = require('../shared-models/Pet');
const School = require('../shared-models/School');
const Sexual = require('../shared-models/Sexual');
const SleepingStyle = require('../shared-models/SleepingStyle');
const Smoking = require('../shared-models/Smoking');
const Social = require('../shared-models/Social');
const Reason = require('../shared-models/Reason');
const Workout = require('../shared-models/Workout');
const Zodiac = require('../shared-models/Zodiac');
const Children = require('../shared-models/Children');
const Drug = require('../shared-models/Drug');

const Topic = require('../shared-models/Topic');
const Package = require('../shared-models/Package');
const configTopic = require('../config/topic');
const { whoYouSeeTypes, whoSeeYouTypes } = require('../config/common');
const Prompt = require('../shared-models/Prompt');
const PromptCategory = require('../shared-models/PromptCategory');
const ReasonAccount = require('../shared-models/ReasonAccount');

const Ethnicity = require('../shared-models/Ethnicity');

class Service extends BaseService {
  constructor() {
    super(Service);
    this.mArea = Area;
    this.mTopic = Topic;
    this.mReason = Reason;
    this.model = Package;
  }

  async getSelections(Model, language, cond) {
    cond = cond || {};
    let [err, lists] = await to(
      Model.find(cond, { sorts: { code: 1, 'insert.when': 1 } }),
    );
    if (err) throw Error(err.message || err);
    if (lists && lists.length) {
      lists = lists.map(item => {
        if (item.langs) {
          return {
            code: item.code,
            value: item.langs[language] || item.langs['en'] || item.code,
          };
        }
        return item.code || item.name;
      });
    }
    return lists;
  }

  /**
   * add code_category in prompt
   * @param {*} Model
   * @param {*} language
   * @param {*} cond
   * @returns
   * Create By; Nvduc
   */
  async getSelectionsPrompt(Model, language, cond) {
    cond = cond || {};
    let [err, lists] = await to(
      Model.find(cond, { sorts: { code: 1, 'insert.when': 1 } }),
    );
    if (err) throw Error(err.message || err);
    if (lists && lists.length) {
      lists = lists.map(item => {
        if (item.langs) {
          return {
            code: item.code,
            codeCategory: item.codeCategory,
            value: item.langs[language] || item.langs['en'] || item.code,
          };
        }
        return item.code || item.name;
      });
    }
    return lists;
  }

  async getSelectionReason(Model, language, cond) {
    cond = cond || {};
    let [err, lists] = await to(
      Model.find(cond, { sorts: { code: 1, 'insert.when': 1 } }),
    );
    if (err) throw Error(err.message || err);
    if (lists && lists.length) {
      lists = lists.map(item => ({
        code: item.code,
        value: item.langs[language] || item.langs['en'],
        codeReason: item.codeReason.map(reason => ({
          codeTitle: reason.codeTitle,
          value: reason.langs[language] || reason.langs['en'],
          codeReasonDetail: reason.codeReasonDetail.map(detail => ({
            codeDetail: detail.codeDetail,
            value: detail.langs[language] || detail.langs['en'],
          })),
        })),
      }));
    }
    return lists;
  }

  async getPreStatics(language) {
    let [err, rs] = await to(
      Promise.all([
        this.getSelections(Gender, language),
        this.getSelections(GenderFilter, language),
        this.getSelections(Sexual, language),
        this.getSelections(Interest, language),
        this.getSelections(School, language),
        this.getSelections(Ethnicity, language),
        this.getSelections(Children, language),
        this.getSelections(Drug, language),
        this.getSelections(FamilyPlan, language),
        this.getSelections(Education, language),
        this.getSelections(Drinking, language),
        this.getSelections(Smoking, language),
      ]),
    );
    if (err) throw Error(err.message || err);
    let data = {
      genders: rs[0],
      genderFilters: rs[1],
      sexuals: rs[2],
      interests: rs[3],
      schools: rs[4],
      ethnicities: rs[5],
      childrens: rs[6],
      drugs: rs[7],
      familyPlans: rs[8],
      educations: rs[9],
      drinkings: rs[10],
      smokings: rs[11],
    };
    return data;
  }

  async getStatics(language) {
    let [err, rs] = await to(
      Promise.all([
        this.getSelections(DatingPurpose, language),
        this.getSelections(Language, language),
        this.getSelections(Interest, language),
        this.getSelections(School, language),
        this.getSelections(JobTitle, language),
        this.getSelections(Sexual, language),
        this.getSelections(Gender, language),
        this.getSelections(GenderFilter, language),
      ]),
    );
    if (err) throw Error(err.message || err);
    let data = {
      datingPurposes: rs[0],
      languages: rs[1],
      interests: rs[2],
      schools: rs[3],
      jobTitles: rs[4],
      sexuals: rs[5],
      genders: rs[6],
      genderFilters: rs[7],
    };
    return data;
  }

  async getBasicInfos(language) {
    let [err, rs] = await to(
      Promise.all([
        this.getSelections(Zodiac, language),
        this.getSelections(Education, language),
        this.getSelections(FamilyPlan, language),
        this.getSelections(CovidVaccine, language),
        this.getSelections(Personality, language),
        this.getSelections(CommunicationStyle, language),
        this.getSelections(LoveStyle, language),
      ]),
    );
    if (err) throw Error(err.message || err);
    let data = {
      zodiacs: rs[0],
      educations: rs[1],
      familyPlans: rs[2],
      covidVaccines: rs[3],
      personalities: rs[4],
      communicationStyles: rs[5],
      loveStyles: rs[6],
      plusCtrl: {
        whoYouSeeTypes,
        whoSeeYouTypes,
      },
    };
    return data;
  }

  async getLifeStyleInfos(language) {
    let [err, rs] = await to(
      Promise.all([
        this.getSelections(Pet, language),
        this.getSelections(Drinking, language),
        this.getSelections(Smoking, language),
        this.getSelections(Workout, language),
        this.getSelections(FoodPreference, language),
        this.getSelections(Social, language),
        this.getSelections(SleepingStyle, language),
      ]),
    );
    if (err) throw Error(err.message || err);
    let data = {
      pets: rs[0],
      drinkings: rs[1],
      smokings: rs[2],
      workouts: rs[3],
      foodPreferences: rs[4],
      socials: rs[5],
      sleepingStyles: rs[6],
    };
    return data;
  }

  /**
   * Lấy danh sách Explore
   * @returns
   */
  async getTopics() {
    let cond = { status: configTopic.status.pending };
    let [err, lists] = await to(this.mTopic.find(cond));
    if (err) throw Error(err.message || err);
    if (lists && lists.length) {
      lists = lists.map(item => {
        let { _id, name, image, typeExplore, description } = item;
        return { _id, name, image, typeExplore, description };
      });
    }
    return lists;
  }

  async getLocations(opts = {}) {
    let isRaw = opts.rawData == true;
    let [err, lists] = await to(this.mArea.find({}));
    if (err) throw Error(err.message || err);
    if (lists && lists.length && !isRaw) {
      lists = lists.map(item => {
        let { name, lng, lat } = item;
        return { name, location: { long: lng, lat } };
      });
    }
    return lists;
  }

  async getPackages() {
    return this.model.getSelections();
  }

  async getReportReasons(language) {
    let [err, lists] = await to(this.mReason.find({}));
    if (err) throw Error(err.message || err);
    if (lists && lists.length) {
      lists = lists.map(item => {
        let { _id, reason, details } = item;
        return { _id, reason, details };
      });
    }
    return lists;
  }

  async getReasonInfor(language) {
    let [err, rs] = await to(
      Promise.all([this.getSelectionReason(ReasonAccount, language)]),
    );
    if (err) throw Error(err.message || err);
    let data = {
      reason: rs[0],
    };

    return data;
  }

  /**
   * Get list prompt by prompt_category
   * @param {*} language
   * @returns
   * Create by: nduc
   */
  async getStaticPrompts(language) {
    let [err, rs] = await to(
      Promise.all([
        this.getSelectionsPrompt(Prompt, language),
        this.getSelections(PromptCategory, language),
      ]),
    );
    if (err) throw Error(err.message || err);

    let arrayPrompts = [];
    rs[1].forEach(element => {
      const findData = rs[0].filter(x => x.codeCategory === element.code);
      if (findData) {
        let modifiedArray = findData.map(item => {
          return {
            code: item.code,
            value: item.value,
          };
        });
        element.prompts = [...modifiedArray];
      }
      arrayPrompts.push(element);
    });
    return arrayPrompts;
  }
}
module.exports = new Service();
