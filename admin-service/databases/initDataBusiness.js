'use strict';

const async = require('async');
const Utils = require('../../utils');

function __x12(tableSchema, filename, key = 'code') {
  const Model = require('@models/' + tableSchema);
  const json = require('./business/' + filename + '.json');
  let data;
  if (Utils.isArray(json)) {
    data = json;
  } else {
    data = json.data;
  }
  async.each(
    data,
    async obj => {
      let cond = {};
      cond[key] = obj[key];
      let data = await Model.getOne(cond);
      if (!data) await Model.insertOne(obj);
    },
    err => {
      if (err) console.log('func__x12 exec error:', err);
    },
  );
}

function __x13(tableSchema, filename) {
  const Model = require('@models/' + tableSchema);
  const json = require('./business/' + filename + '.json');
  async.each(
    json,
    async obj => {
      if (Utils.isString(obj)) obj = { name: obj };
      let cond = { name: obj.name };
      let data = await Model.getOne(cond);
      if (!data) await Model.insertOne(obj);
    },
    err => {
      if (err) console.log('func__x13 exec error:', err);
    },
  );
}

// cannabis not use
__x12('CommunicationStyle', 'communicationStyles');
__x12('CovidVaccine', 'covidVaccines');
__x12('DatingPurpose', 'datingPurposes');
__x12('Drinking', 'drinkings');
__x12('Education', 'educations');
__x12('FamilyPlan', 'familyPlans');
__x12('FoodPreference', 'foodPreferences');
__x12('GenderFilter', 'genderFilters');
__x12('Gender', 'genders');
__x12('Interest', 'interests');
__x12('Language', 'languages');
__x12('LoveStyle', 'loveStyles');
__x12('Personality', 'personalities');
__x12('Pet', 'pets');
__x12('Sexual', 'sexuals');
__x12('SleepingStyle', 'sleepingHabits');
__x12('Smoking', 'smokings');
__x12('Social', 'socials');
__x12('Workout', 'workouts');
__x12('Zodiac', 'zodiacs');
__x12('Ethnicity', 'ethnicities');
__x12('Children', 'childrens');
__x12('Drug', 'drugs');
__x12('Prompt', 'prompts');
__x12('MessageBot', 'messageBot');
__x12('PromptCategory', 'promptCategory');
__x12('Topic', 'topics', 'name');
__x12('Package', 'packages', 'name');
__x12('Area', 'areas', 'name');
// ============================ //
__x13('School', 'schools', 'name');
__x13('JobTitle', 'jobTitles');

function convertStaticJson(obj) {
  let arr = Object.keys(obj);
  var json = {};
  arr.map(key => {
    let data = obj[key];
    Object.keys(data).map(item => {
      if (json[item]) {
        json[item].langs[key] = data[item];
      } else {
        json[item] = { code: item, langs: {} };
        json[item].langs[key] = data[item];
      }
    });
  });
  // return json;
  return Object.values(json);
}
