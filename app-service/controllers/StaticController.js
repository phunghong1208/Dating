// 'use strict';

// const to = require('await-to-js').default;
// const HttpUtil = require('../../utils/http');
// const BaseController = require('../../Base');
// const Service = require('../../shared-services/static');
// const ReasonAccount = require('../../shared-models/ReasonAccount');
// const mongoose = require('mongoose');

// class Controller extends BaseController {
//   constructor() {
//     super(Controller);
//     this.service = Service;
//     this.mReasonAccount = ReasonAccount;
//   }

//   async getStaticInfos(req, res) {
//     let { language = 'en' } = req.headers;
//     let [err, data] = await to(this.service.getStatics(language));
//     if (err) return HttpUtil.unprocessable(res, err);
//     return HttpUtil.success(res, data);
//   }

//   async getBasicInfos(req, res) {
//     let { language = 'en' } = req.headers;
//     let [err, data] = await to(this.service.getBasicInfos(language));
//     if (err) return HttpUtil.unprocessable(res, err);
//     return HttpUtil.success(res, data);
//   }

//   async getLifeStyles(req, res) {
//     let { language = 'en' } = req.headers;
//     let [err, data] = await to(this.service.getLifeStyleInfos(language));
//     if (err) return HttpUtil.unprocessable(res, err);
//     return HttpUtil.success(res, data);
//   }

//   async getTopics(req, res) {
//     let { language = 'en' } = req.headers;
//     let [err, data] = await to(this.service.getTopics(language));
//     if (err) return HttpUtil.unprocessable(res, err);
//     return HttpUtil.success(res, data);
//   }

//   async getPackages(req, res) {
//     let { language = 'en' } = req.headers;
//     let [err, data] = await to(this.service.getPackages(language));
//     if (err) return HttpUtil.unprocessable(res, err);
//     return HttpUtil.success(res, data);
//   }

//   async getReasons(req, res) {
//     let { language = 'en' } = req.headers;
//     let [err, data] = await to(this.service.getReportReasons(language));
//     if (err) return HttpUtil.unprocessable(res, err);
//     return HttpUtil.success(res, data);
//   }

//   async getReasonInfos(req, res) {
//     let { language = 'en' } = req.headers;
//     let [err, data] = await to(this.service.getReasonInfor(language));
//     if (err) return HttpUtil.unprocessable(res, err);
//     return HttpUtil.success(res, data);
//   }

//   async importReason(req, res) {
//     const requireParams = [
//       { name: 'code', dataType: 'string', acceptEmpty: true },
//       { name: 'langs', dataType: 'object', acceptEmpty: true },
//       { name: 'codeReason', dataType: 'array', acceptEmpty: true },
//     ];

//     let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
//     if (params.error) return HttpUtil.badRequest(res, params.error);
//     let authUser = req.authUser;

//     const [errImage, reason] = await to(
//       this.mReasonAccount.insertObject(params),
//     );
//     if (errImage) {
//       console.log('register insert image error', errImage);
//     } else {
//       console.log('image success');
//     }
//     return HttpUtil.success(res, params);
//   }
// }

// module.exports = new Controller();
