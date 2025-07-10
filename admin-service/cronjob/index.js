// https://github.com/kelektiv/node-cron
const CronJob = require('cron').CronJob;
const moment = require('moment');
const { cleanSessionDisconnectedSockets } = require('../services/socket');
const {
  fetchTinderIds,
  getUserProfile,
  tinderPing,
} = require('../services/tinder');
const { getLocations } = require('../services/static');
const to = require('await-to-js').default;
const { API_TOKEN_TINDER } = process.env;
const ModelJob = require('../models/Job');
const Model = require('../models/Customer');
const EnvUtil = require('../utils/env');

const TimeZoneVN = 'Asia/Ho_Chi_Minh';
const TAG = '[cronjob/cron.js]';
const defaultFormatDate = 'YYYY-MM-DD HH:mm:ss';
let tinderOptions = {
  token: API_TOKEN_TINDER,
  locationNames: [],
  area: null,
  numberFetchData: 0,
  maxChangeLocation: 10,
};

function setEnv(value) {
  return EnvUtil.set('API_TOKEN_TINDER', value);
}

module.exports = {
  jobs: [],

  addJob(time, cb) {
    return new CronJob(time, () => cb(), null, true, TimeZoneVN);
  },

  removeJob(job) {
    job.stop();
  },

  async start(apiToken) {
    if (apiToken) {
      tinderOptions.token = apiToken;
      setEnv(apiToken);
    }
    try {
      let job = this.addJob('*/10 * * * * *', fetchTinder);
      this.jobs.push(job);
      return true;
    } catch (e) {
      console.log(`${TAG} start error:`, e);
      throw Error(e.message);
    }
  },

  async stop() {
    try {
      this.jobs.map(job => this.removeJob(job));
      this.jobs = [];
      return true;
    } catch (e) {
      console.log(`${TAG} stop error:`, e);
      throw Error(e.message);
    }
  },

  async init() {
    try {
      this.addJob('*/5 * * * * *', cleanSessionDisconnectedSockets);
    } catch (e) {
      console.log(`${TAG} add cleanSessionDisconnectedSockets error:`, e);
    }
  },
};

async function fetchTinder() {
  const funcName = 'fetchTinder';
  let timeStart = moment();
  console.log(
    `${TAG} ${funcName} start at ${timeStart.format(defaultFormatDate)}`,
  );
  // update location -> get data by locations
  await updateLocation();
  // handle jobs
  let message,
    isSuccess = false,
    insertdb = 0;
  let [err, data] = await to(fetchTinderIds(tinderOptions.token));
  if (err) {
    console.log(`${TAG} ${funcName} fetchTinderIds error`, err.message);
    message = err.message;
  } else {
    console.log(`${TAG} ${funcName} fetchTinderIds count`, data.length);
    let ret = await Promise.all(data.map(uid => checkExistDB(uid)));
    let ids = [];
    ret.map(item => {
      if (!item.check) ids.push(item.uid);
    });
    console.log(`${TAG} ${funcName} check dupplicate`, ids.length);
    if (ids.length) {
      let users = [];
      async function getUserTinder(ids, index) {
        let length = ids.length;
        let uid = ids[index];
        if (index < length - 1) {
          let [err, user] = await to(getUserProfile(uid, tinderOptions.token));
          if (err)
            console.log(`${TAG} ${funcName} getUserProfile ${uid} error`, err);
          if (user) users.push(user);
          index += 1;
          return getUserTinder(ids, index);
        } else {
          let [err, user] = await to(getUserProfile(uid, tinderOptions.token));
          if (err)
            console.log(`${TAG} ${funcName} getUserProfile ${uid} error`, err);
          if (user) users.push(user);
          return true;
        }
      }
      ret = await getUserTinder(ids, 0);
      // console.log(`${TAG} ${funcName} getUserProfile data`, users);
      ret = await Promise.all(users.map(user => insertDB(user)));
      console.log(`${TAG} ${funcName} insert data`, ret);
      ret.map(item => {
        if (!item.isError) insertdb++;
      });
      message = `total: ${data.length} records, insertdb: ${insertdb} records`;
      isSuccess = true;
    }
  }
  let timeEnd = moment();
  let obj = { name: funcName, timeStart, timeEnd, message, isSuccess };
  await ModelJob.insertOne(obj, { _id: 'manhlv2512@gmail.com' });
  tinderOptions.numberFetchData += 1;
  console.log(
    `${TAG} ${funcName} end at ${timeEnd.format(defaultFormatDate)}, ${message}`,
  );
}

async function updateLocation() {
  if (tinderOptions.numberFetchData == tinderOptions.maxChangeLocation) {
    tinderOptions.numberFetchData = 0; // reset cond check
    let locations = await getLocations();
    if (locations && locations.length) {
      let check = false;
      for (let i = 0; i < locations.length; i++) {
        let area = locations[i];
        if (tinderOptions.locationNames.indexOf(area.name) == -1) {
          tinderOptions.locationNames.push(area.name);
          tinderOptions.area = area;
          check = true;
          break;
        }
      }
      if (!check) {
        let area = locations[0];
        tinderOptions.locationNames.push(area.name);
        tinderOptions.area = area;
      }
      await tinderPing(tinderOptions.token, tinderOptions.area.location);
      // chờ sau 1s để tinder update được location
      setTimeout(() => {
        console.log(
          `${TAG} update tinder location`,
          JSON.stringify(tinderOptions.area),
        );
        return true;
      }, 1000);
    }
  }
  return false;
}

async function insertDB(user) {
  console.log(`${TAG} insertDB user`, user);
  let [err, data] = await to(Model.getOne({ oAuth2Id: user.oAuth2Id }));
  if (err || data) return { key: user.oAuth2Id, isError: 1 };
  [err, data] = await to(Model.insertOne(user));
  if (err) {
    console.log(`${TAG} insertDB ${user.oAuth2Id} error`, err);
    return { key: user.oAuth2Id, isError: 2 };
  }
  return { key: user.oAuth2Id, isError: 0 };
}

async function checkExistDB(uid) {
  let check = false;
  let [err, data] = await to(Model.getOne({ oAuth2Id: uid }));
  if (err || data) check = true;
  return { uid, check };
}
