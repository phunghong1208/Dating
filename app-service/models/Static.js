'use strict';

const to = require('await-to-js').default;
const BaseModel = require('./Base');
const Entities = require('../databases/entities');
const Zodiac = require('../models/Zodiac');
const Education = require('../models/Education');
const FamilyPlan = require('../models/FamilyPlan');
const CovidVaccine = require('../models/CovidVaccine');
const Personality = require('../models/Personality');
const CommunicationStyle = require('../models/CommunicationStyle');
const LoveStyle = require('../models/LoveStyle');
const Pet = require('../models/Pet');
const Drinking = require('../models/Drinking');
const Smoking = require('../models/Smoking');
const Workout = require('../models/Workout');
const FoodPreference = require('../models/FoodPreference');
const Social = require('../models/Social');
const SleepingStyle = require('../models/SleepingStyle');
const PromptCategory = require('../models/PromptCategory');
const Prompt = require('../models/Prompt');
const DatingPurpose = require('../models/DatingPurpose');
const Language = require('../models/Language');
const Interest = require('../models/Interest');
const School = require('../models/School');
const JobTitle = require('../models/JobTitle');
const Sexual = require('../models/Sexual');
const Gender = require('../models/Gender');
const GenderFilter = require('../models/GenderFilter');

class Static extends BaseModel {
  constructor() {
    super('Static', Entities.statics);
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

  async getCommon(language){
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

  async getStaticPromptModel(language){
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

module.exports = new Static();
