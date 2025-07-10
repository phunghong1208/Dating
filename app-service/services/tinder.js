'use strict';

const axios = require('axios');
const moment = require('moment');
const to = require('await-to-js').default;
const BaseService = require('./Base');
const FileUtil = require('../../utils/files');
const Utils = require('../../utils');
const appDir = process.env.PWD;
const businessDir = `${appDir}/app/databases/business`;
const businessData = require('../databases/business');

const urls = {
  GET_OTP: 'https://api.gotinder.com/v2/auth/sms/send?auth_type=sms',
  GET_REFRESH_TOKEN:
    'https://api.gotinder.com/v2/auth/sms/validate?auth_type=sms',
  GET_API_TOKEN: 'https://api.gotinder.com/v2/auth/login/sms',
  GET_CARDS: 'https://api.gotinder.com/v2/recs/core?locale=en',
  GET_USER_PROFILE: 'https://api.gotinder.com/user/',
  GET_PROFILE: 'https://api.gotinder.com/v2/profile',
  UPDATE_LOCATION: 'https://api.gotinder.com/v2/meta?locale=en',
};
const pInclude = 'account,available_descriptors,spotify,user';
const userAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36';
const genders = {
  0: 'men',
  1: 'women',
  '-1': 'other',
};

const genderFilters = {
  0: 'men',
  1: 'women',
  '-1': 'all',
};

class Service extends BaseService {
  constructor() {
    super(Service);
    this.init();
  }

  init() {
    this.headers = {
      'Content-Type': 'application/json',
      'user-agent': userAgent,
    };
    this.languages = this.getDataBusiness('languages');
    this.datingPurposes = this.getDataBusiness('datingPurposes');
    this.interests = this.getDataBusiness('interests');
    this.communicationStyles = this.getDataBusiness('communicationStyles');
    this.covidVaccines = this.getDataBusiness('covidVaccines');
    this.drinkings = this.getDataBusiness('drinkings');
    this.educations = this.getDataBusiness('educations');
    this.familyPlans = this.getDataBusiness('familyPlans');
    this.foodPreferences = this.getDataBusiness('foodPreferences');
    this.loveStyles = this.getDataBusiness('loveStyles');
    this.personalities = this.getDataBusiness('personalities');
    this.pets = this.getDataBusiness('pets');
    this.sexuals = this.getDataBusiness('sexuals');
    this.sleepingHabits = this.getDataBusiness('sleepingHabits');
    this.smokings = this.getDataBusiness('smokings');
    this.socials = this.getDataBusiness('socials');
    this.workouts = this.getDataBusiness('workouts');
    this.zodiacs = this.getDataBusiness('zodiacs');
  }

  getDataBusiness(key) {
    let obj = {};
    let json = businessData[key];
    json.map(({ code, langs }) => {
      obj[langs.en] = code;
    });
    return obj;
  }

  async httpPost(url, data, token) {
    let headers = { ...this.headers };
    if (token) headers['x-auth-token'] = token;
    return await axios({
      method: 'POST',
      url,
      data,
      headers,
    });
  }

  async httpGet(url, token, params = {}) {
    let headers = { ...this.headers, 'x-auth-token': token };
    return await axios({
      method: 'GET',
      url,
      headers,
      params,
    });
  }

  async sendOtpCode(phone_number) {
    let [err, rs] = await to(this.httpPost(urls.GET_OTP, { phone_number }));
    if (err) throw Error(err.message || err);
    // rs.sms_sent == true
    return rs;
  }

  async getRefreshToken(phone_number, otp_code) {
    let [err, rs] = await to(
      this.httpPost(urls.GET_REFRESH_TOKEN, { phone_number, otp_code }),
    );
    if (err) throw Error(err.message || err);
    return rs.refresh_token || rs;
  }

  async getApiToken(refresh_token) {
    let [err, rs] = await to(
      this.httpPost(urls.GET_API_TOKEN, { refresh_token }),
    );
    if (err) throw Error(err.message || err);
    return rs.api_token || rs;
  }

  async tinderPing(token, { lat, long }) {
    let params = {
      lat: Number(lat),
      lon: Number(long),
      force_fetch_resources: true,
    };
    return await this.httpPost(urls.UPDATE_LOCATION, params, token);
  }

  async fetchTinderIds(token) {
    let [err, rs] = await to(this.httpGet(urls.GET_CARDS, token));
    if (err) throw Error(err.message || err);
    let { status, statusText, data } = rs;
    if (status !== 200 || !data.data) throw Error(statusText || status);
    if (!data.data.results) {
      throw Error(
        (data.meta.status || JSON.stringify(data.meta)) +
          '--' +
          JSON.stringify(data.data),
      );
    }
    let lists = data.data.results.map(item => item.user._id);
    return lists;
  }

  async getCards(token) {
    let [err, rs] = await to(this.httpGet(urls.GET_CARDS, token));
    if (err) throw Error(err.message || err);
    let { status, statusText, data } = rs;
    if (status !== 200 || !data.data) throw Error(statusText || status);
    if (!data.data.results) throw Error(data.meta.status || data.meta);
    return this.handleDataUser(data.data.results);
  }

  async getUserProfile(uid, token) {
    let [err, rs] = await to(
      this.httpGet(`${urls.GET_USER_PROFILE}${uid}`, token),
    );
    if (err) throw Error(err.message || err);
    let { status, statusText, data } = rs;
    if (status !== 200 || !data) throw Error(statusText || status);
    if (data.status !== 200 || !data.results) throw Error(data.status);
    return this.handleUserProfile(data.results);
  }

  handleUserProfile(user) {
    let {
      photos,
      jobs,
      schools,
      city,
      sexual_orientations,
      selected_descriptors,
      user_interests = {},
      global_mode = {},
      auto_expansion = {},
      distance_mi = 10,
      age_filter_min = 15,
      age_filter_max = 30,
      gender_filter = -1,
    } = user;
    let { age_toggle = false, distance_toggle = false } = auto_expansion;

    return {
      oAuth2Id: user._id,
      fullname: user.name,
      phone: String(user.s_number),
      dob: this.getDob(user.birth_date),
      profiles: {
        about: user.bio,
        showGender: user.show_gender_on_profile || false,
        gender: this.getGender(user.gender),
        avatars: this.getAvatars(photos),
        orientationSexuals: this.getSexuals(sexual_orientations),
        showSexual: user.show_orientation_on_profile || false,
        school: this.getSchools(schools),
        ...this.getJobs(jobs),
        address: this.getAddres(city),
        onlineNow: true,
        interests: this.getInterests(user_interests.selected_interests),
        ...this.getInfoBasic(selected_descriptors),
      },
      settings: {
        global: this.getGlobalMode(global_mode),
        autoPlayVideo: user.autoplay_video || 'always',
        genderFilter: this.getGenderFilter(gender_filter),
        showTopPick: user.top_picks_discoverable || false,
        incognitoMode: !user.discoverable,
        showSameOrientationSexual: this.getShowSameOrientationSexual(
          user.show_same_orientation_first,
        ),
        distancePreference: {
          range: distance_mi,
          onlyShowInThis: distance_toggle,
        },
        agePreference: {
          min: age_filter_min,
          max: age_filter_max,
          onlyShowInThis: age_toggle,
        },
      },
      lastActiveTime: user.ping_time,
    };
  }

  async getProfile(token, locale = 'en', raw = false) {
    let params = {
      locale,
      include: pInclude,
    };
    let [err, rs] = await to(this.httpGet(urls.GET_PROFILE, token, params));
    if (err) throw Error(err.message || err);
    let { status, statusText, data } = rs;
    if (!data.data) throw Error(statusText || status);
    let { user, spotify, account } = data.data;
    return raw ? user : this.handleProfile(user);
  }

  async cloneInterests(token) {
    const locales = ['en', 'vi', 'ja'];
    let jobs = locales.map(locale => this.getProfile(token, locale, true));
    let [err, rs] = await to(Promise.all(jobs));
    if (err) throw Error(err.message || err);
    let interests = {};
    _setLocales(rs[0], 'en');
    _setLocales(rs[1], 'vi');
    _setLocales(rs[2], 'ja');

    function _setLocales(data, key) {
      let { user_interests = {} } = data;
      let lists = user_interests.available_interests || [];
      if (lists.length) {
        lists.map(({ id, name }) => {
          if (!interests[id]) interests[id] = {};
          interests[id][key] = name;
        });
      }
    }
    await this.createBusinessData(interests, 'interests', 'it');
    return interests;
  }

  async cloneAvaiableDescriptors(token) {
    const locales = ['en', 'vi', 'ja'];
    let jobs = locales.map(locale =>
      this.getAvaiableDescriptors(token, locale),
    );
    let [err, rs] = await to(Promise.all(jobs));
    if (err) throw Error(err.message || err);
    // console.log("cloneAvaiableDescriptors", rs);
    let relationTypes = {},
      languages = {},
      basics = [],
      lifeStyles = [],
      datingPurposes = {};
    let zodiacs = {},
      educations = {},
      familyPlans = {},
      covidVaccines = {},
      personalities = {},
      communicationStyles = {},
      loveStyles = {};
    let pets = {},
      drinkings = {},
      smokings = {},
      cannabis = {},
      workouts = {},
      dietaryPreferences = {},
      socials = {},
      sleepingHabits = {};
    _setLocales(rs[0], 'en');
    _setLocales(rs[1], 'vi');
    _setLocales(rs[2], 'ja');

    function _setLocales(data, key) {
      data.map(item => {
        if (item.section_id == 'sec_0') {
          let lists = item.descriptors[0].choices;
          lists.map(({ id, name }) => {
            if (!datingPurposes[id]) datingPurposes[id] = {};
            datingPurposes[id][key] = name;
          });
        }
        if (item.section_id == 'sec_6') {
          let lists = item.descriptors[0].choices;
          lists.map(({ id, name }) => {
            if (!relationTypes[id]) relationTypes[id] = {};
            relationTypes[id][key] = name;
          });
        }
        if (item.section_id == 'sec_5') {
          let lists = item.descriptors[0].choices;
          lists.map(({ id, name }) => {
            if (!languages[id]) languages[id] = {};
            languages[id][key] = name;
          });
        }
        if (item.section_id == 'sec_4') {
          basics = item.descriptors;
          for (let i = 0; i < basics.length; i++) {
            let record = basics[i];
            if (record.id == 'de_1') {
              record.choices.map(({ id, name }) => {
                if (!zodiacs[id]) zodiacs[id] = {};
                zodiacs[id][key] = name;
              });
              continue;
            }
            if (record.id == 'de_9') {
              record.choices.map(({ id, name }) => {
                if (!educations[id]) educations[id] = {};
                educations[id][key] = name;
              });
              continue;
            }
            if (record.id == 'de_33') {
              record.choices.map(({ id, name }) => {
                if (!familyPlans[id]) familyPlans[id] = {};
                familyPlans[id][key] = name;
              });
              continue;
            }
            if (record.id == 'de_34') {
              record.choices.map(({ id, name }) => {
                if (!covidVaccines[id]) covidVaccines[id] = {};
                covidVaccines[id][key] = name;
              });
              continue;
            }
            if (record.id == 'de_13') {
              record.choices.map(({ id, name }) => {
                if (!personalities[id]) personalities[id] = {};
                personalities[id][key] = name;
              });
              continue;
            }
            if (record.id == 'de_2') {
              record.choices.map(({ id, name }) => {
                if (!communicationStyles[id]) communicationStyles[id] = {};
                communicationStyles[id][key] = name;
              });
              continue;
            }
            if (record.id == 'de_35') {
              record.choices.map(({ id, name }) => {
                if (!loveStyles[id]) loveStyles[id] = {};
                loveStyles[id][key] = name;
              });
              continue;
            }
          }
        }
        if (item.section_id == 'sec_1') {
          lifeStyles = item.descriptors;
          for (let i = 0; i < lifeStyles.length; i++) {
            let record = lifeStyles[i];
            if (record.id == 'de_3') {
              record.choices.map(({ id, name }) => {
                if (!pets[id]) pets[id] = {};
                pets[id][key] = name;
              });
              continue;
            }
            if (record.id == 'de_22') {
              record.choices.map(({ id, name }) => {
                if (!drinkings[id]) drinkings[id] = {};
                drinkings[id][key] = name;
              });
              continue;
            }
            if (record.id == 'de_11') {
              record.choices.map(({ id, name }) => {
                if (!smokings[id]) smokings[id] = {};
                smokings[id][key] = name;
              });
              continue;
            }
            if (record.id == 'de_36') {
              record.choices.map(({ id, name }) => {
                if (!cannabis[id]) cannabis[id] = {};
                cannabis[id][key] = name;
              });
              continue;
            }
            if (record.id == 'de_10') {
              record.choices.map(({ id, name }) => {
                if (!workouts[id]) workouts[id] = {};
                workouts[id][key] = name;
              });
              continue;
            }
            if (record.id == 'de_7') {
              record.choices.map(({ id, name }) => {
                if (!dietaryPreferences[id]) dietaryPreferences[id] = {};
                dietaryPreferences[id][key] = name;
              });
              continue;
            }
            if (record.id == 'de_4') {
              record.choices.map(({ id, name }) => {
                if (!socials[id]) socials[id] = {};
                socials[id][key] = name;
              });
              continue;
            }
            if (record.id == 'de_17') {
              record.choices.map(({ id, name }) => {
                if (!sleepingHabits[id]) sleepingHabits[id] = {};
                sleepingHabits[id][key] = name;
              });
              continue;
            }
          }
        }
      });
    }
    await Promise.all([
      // this.createBusinessData(relationTypes, "relationTypes"),
      this.createBusinessData(datingPurposes, 'datingPurposes'),
      this.createBusinessData(languages, 'languages'),
      this.createBusinessData(zodiacs, 'zodiacs', 'en'),
      this.createBusinessData(educations, 'educations'),
      this.createBusinessData(familyPlans, 'familyPlans'),
      this.createBusinessData(covidVaccines, 'covidVaccines', 'en'),
      // this.createBusinessData(personalities, "personalities", "en"),
      // this.createBusinessData(communicationStyles, "communicationStyles"),
      this.createBusinessData(loveStyles, 'loveStyles'),
      this.createBusinessData(pets, 'pets'),
      this.createBusinessData(drinkings, 'drinkings'),
      this.createBusinessData(smokings, 'smokings'),
      // this.createBusinessData(cannabis, "cannabis"),
      this.createBusinessData(workouts, 'workouts', 'en'),
      this.createBusinessData(dietaryPreferences, 'foodPreferences', 'en'),
      this.createBusinessData(socials, 'socials'),
      this.createBusinessData(sleepingHabits, 'sleepingHabits'),
    ]);
    return {
      relationTypes,
      languages,
      datingPurposes,
      zodiacs,
      educations,
      familyPlans,
      covidVaccines,
      personalities,
      communicationStyles,
      loveStyles,
      pets,
      drinkings,
      smokings,
      cannabis,
      workouts,
      dietaryPreferences,
      socials,
      sleepingHabits,
    };
  }

  async createBusinessData(data, filename, key = 'item') {
    let lists = Object.values(data);
    lists = lists.map((item, index) => {
      let code = `${key}_${index + 1}`;
      if (item[key]) code = Utils.generateKeyFromText(item[key]);
      return { code, langs: item };
    });
    let json = { data: lists, count: lists.length };
    return await FileUtil.writeFile(`${filename}.json`, businessDir, json);
  }

  async getAvaiableDescriptors(token, locale) {
    let params = {
      locale,
      // include: "available_descriptors"
      include: pInclude,
    };
    let [err, rs] = await to(this.httpGet(urls.GET_PROFILE, token, params));
    if (err) throw Error(err.message || err);
    let { status, statusText, data } = rs;
    if (!data.data) throw Error(statusText || status);
    let { available_descriptors } = data.data;
    return available_descriptors;
  }

  handleProfile(user) {
    let {
      pos = {},
      photos,
      jobs,
      schools,
      city,
      sexual_orientations,
      selected_descriptors,
      user_interests = {},
      global_mode = {},
      auto_expansion = {},
      distance_filter = 10,
      age_filter_min = 15,
      age_filter_max = 30,
    } = user;
    let { age_toggle = false, distance_toggle = false } = auto_expansion;

    return {
      oAuth2Id: user._id,
      fullname: user.name,
      phone: user.phone_id || '',
      dob: this.getDob(user.birth_date),
      profiles: {
        about: user.bio,
        showGender: user.show_gender_on_profile,
        gender: this.getGender(user.gender),
        avatars: this.getAvatars(photos),
        orientationSexuals: this.getSexuals(sexual_orientations),
        showSexual: user.show_orientation_on_profile,
        school: this.getSchools(schools),
        ...this.getJobs(jobs),
        address: this.getAddres(city),
        onlineNow: true,
        interests: this.getInterests(user_interests.selected_interests),
        ...this.getInfoBasic(selected_descriptors),
      },
      settings: {
        global: this.getGlobalMode(global_mode),
        autoPlayVideo: user.autoplay_video || 'no',
        genderFilter: this.getGenderFilter(user.gender_filter),
        showTopPick: user.top_picks_discoverable,
        incognitoMode: !user.discoverable,
        showSameOrientationSexual: this.getShowSameOrientationSexual(
          user.show_same_orientation_first,
        ),
        distancePreference: {
          range: distance_filter,
          onlyShowInThis: distance_toggle,
        },
        agePreference: {
          min: age_filter_min,
          max: age_filter_max,
          onlyShowInThis: age_toggle,
        },
      },
      location: {
        lat: pos.lat,
        long: pos.lon,
      },
      lastActiveTime: user.ping_time,
    };
  }

  handleDataUser(lists = []) {
    if (!lists.length) return lists;

    return lists.map(item => {
      let { user, experiment_info, s_number, distance_mi = 10 } = item;
      let {
        bio,
        birth_date,
        name,
        photos,
        gender,
        show_gender_on_profile,
        sexual_orientations,
        online_now,
        jobs,
        schools,
        city,
        selected_descriptors,
        hide_age = false,
        hide_distance = false,
        global_mode = {},
        age_filter_min = 15,
        age_filter_max = 30,
        gender_filter = -1,
      } = user;

      let user_interests = {};
      if (experiment_info)
        user_interests = experiment_info.user_interests || {};

      return {
        oAuth2Id: user._id,
        fullname: name,
        phone: String(s_number),
        dob: this.getDob(birth_date),
        profiles: {
          about: bio,
          showGender: show_gender_on_profile,
          gender: this.getGender(gender),
          avatars: this.getAvatars(photos),
          orientationSexuals: this.getSexuals(sexual_orientations),
          interests: this.getInterests(user_interests.selected_interests),
          school: this.getSchools(schools),
          ...this.getJobs(jobs),
          address: this.getAddres(city),
          onlineNow: online_now || false,
          ...this.getInfoBasic(selected_descriptors),
        },
        settings: {
          global: this.getGlobalMode(global_mode),
          autoPlayVideo: user.autoplay_video || 'always',
          genderFilter: this.getGenderFilter(gender_filter),
          showTopPick: user.top_picks_discoverable,
          incognitoMode: !user.discoverable,
          showSameOrientationSexual: false,
          distancePreference: {
            range: distance_mi,
            onlyShowInThis: hide_distance,
          },
          agePreference: {
            min: age_filter_min,
            max: age_filter_max,
            onlyShowInThis: hide_age,
          },
        },
      };
    });
  }

  getDob(str) {
    let dob = moment().format('YYYY-MM-DD');
    if (str) dob = str.substr(0, 10);
    return dob;
  }

  getGender(vlue) {
    vlue = String(vlue);
    return genders[vlue] || vlue;
  }

  getGenderFilter(vlue) {
    vlue = String(vlue);
    return genderFilters[vlue] || vlue;
  }

  getShowSameOrientationSexual(obj) {
    let checked = false;
    if (obj && obj.checked) checked = obj.checked;
    return checked;
  }

  getAvatars(photos) {
    photos = photos || [];
    return photos.map(item => item.url);
  }

  getSexuals(lists) {
    lists = lists || [];
    return lists.map(item => {
      let key = item.name;
      return this.sexuals[key] || key;
    });
  }

  getInterests(lists) {
    lists = lists || [];
    return lists.map(item => {
      let key = item.name;
      return this.interests[key] || key;
    });
  }

  getSchools(schools) {
    schools = this.getListByName(schools);
    return schools.join(', ');
  }

  getListByName(lists) {
    lists = lists || [];
    return lists.map(item => item.name);
  }

  /*
    "city": {
      "name": "Hà Nội",
      "region": "Việt Nam"
    }
  */
  getAddres(city = {}) {
    let { name, region } = city;
    let arr = [];
    if (name) arr.push(name);
    if (region) arr.push(region);
    return arr.join(', ');
  }

  getJobs(lists) {
    let obj = { company: '', jobTitle: '' };
    if (lists && lists.length) {
      lists.map(item => {
        if (item.company && item.company.name) obj.company = item.company.name;
        if (item.title && item.title.name) obj.jobTitle = item.title.name;
      });
    }
    return obj;
  }

  getGlobalMode(obj) {
    let { is_enabled = false, language_preferences = [] } = obj;
    return {
      isEnabled: is_enabled,
      languages: language_preferences.map(item => {
        return this.languages[item.language] || item.language;
      }),
    };
  }

  getInfoBasic(descriptors = []) {
    let obj = {
      datingPurpose: '',
      languages: [],
    };
    if (descriptors.length) {
      for (let i = 0; i < descriptors.length; i++) {
        let item = descriptors[i];
        if (item.section_id == 'sec_0' || item.id == 'de_29') {
          // Mục đích hẹn hò
          if (item.choice_selections && item.choice_selections[0]) {
            let vlue = item.choice_selections[0].name;
            obj.datingPurpose = this.datingPurposes[vlue] || vlue;
            continue;
          }
        }
        if (item.section_id == 'sec_5' || item.id == 'de_37') {
          // Ngôn ngữ tôi biết
          if (item.choice_selections && item.choice_selections.length) {
            obj.languages = item.choice_selections.map(choice => {
              return this.languages[choice.name] || choice.name;
            });
            continue;
          }
        }
        if (item.name == 'Zodiac' || item.id == 'de_1') {
          if (item.choice_selections && item.choice_selections[0]) {
            let vlue = item.choice_selections[0].name;
            obj.zodiac = this.zodiacs[vlue] || vlue;
            continue;
          }
        }
        if (item.name == 'Education' || item.id == 'de_9') {
          if (item.choice_selections && item.choice_selections[0]) {
            let vlue = item.choice_selections[0].name;
            obj.education = this.educations[vlue] || vlue;
            continue;
          }
        }
        if (item.name == 'Family Plans' || item.id == 'de_33') {
          if (item.choice_selections && item.choice_selections[0]) {
            let vlue = item.choice_selections[0].name;
            obj.familyPlan = this.familyPlans[vlue] || vlue;
            continue;
          }
        }
        if (item.name == 'COVID Vaccine' || item.id == 'de_33') {
          if (item.choice_selections && item.choice_selections[0]) {
            let vlue = item.choice_selections[0].name;
            obj.covidVaccine = this.covidVaccines[vlue] || vlue;
            continue;
          }
        }
        if (item.name == 'Personality Type' || item.id == 'de_13') {
          if (item.choice_selections && item.choice_selections[0]) {
            let vlue = item.choice_selections[0].name;
            obj.personality = this.personalities[vlue] || vlue;
            continue;
          }
        }
        if (item.name == 'Communication Style' || item.id == 'de_2') {
          if (item.choice_selections && item.choice_selections[0]) {
            let vlue = item.choice_selections[0].name;
            obj.communicationType = this.communicationStyles[vlue] || vlue;
            continue;
          }
        }
        if (item.name == 'Love Stype' || item.id == 'de_35') {
          if (item.choice_selections && item.choice_selections[0]) {
            let vlue = item.choice_selections[0].name;
            obj.loveStyle = this.loveStyles[vlue] || vlue;
            continue;
          }
        }
        if (item.name == 'Pets' || item.id == 'de_3') {
          if (item.choice_selections && item.choice_selections[0]) {
            let vlue = item.choice_selections[0].name;
            obj.pet = this.pets[vlue] || vlue;
            continue;
          }
        }
        if (item.name == 'Drinking' || item.id == 'de_22') {
          if (item.choice_selections && item.choice_selections[0]) {
            let vlue = item.choice_selections[0].name;
            obj.drinking = this.drinkings[vlue] || vlue;
            continue;
          }
        }
        if (item.name == 'Smoking' || item.id == 'de_11') {
          if (item.choice_selections && item.choice_selections[0]) {
            let vlue = item.choice_selections[0].name;
            obj.smoking = this.smokings[vlue] || vlue;
            continue;
          }
        }
        if (item.name == 'Workout' || item.id == 'de_10') {
          if (item.choice_selections && item.choice_selections[0]) {
            let vlue = item.choice_selections[0].name;
            obj.workout = this.workouts[vlue] || vlue;
            continue;
          }
        }
        if (item.name == 'Dietary Preference' || item.id == 'de_7') {
          if (item.choice_selections && item.choice_selections[0]) {
            let vlue = item.choice_selections[0].name;
            obj.dietaryPreference = this.foodPreferences[vlue] || vlue;
            continue;
          }
        }
        if (item.name == 'Social Media' || item.id == 'de_4') {
          if (item.choice_selections && item.choice_selections[0]) {
            let vlue = item.choice_selections[0].name;
            obj.socialMedia = this.socials[vlue] || vlue;
            continue;
          }
        }
        if (item.name == 'Sleeping Habits' || item.id == 'de_17') {
          if (item.choice_selections && item.choice_selections[0]) {
            let vlue = item.choice_selections[0].name;
            obj.sleepingHabit = this.sleepingHabits[vlue] || vlue;
            continue;
          }
        }
      }
    }
    return obj;
  }
}

module.exports = new Service();
