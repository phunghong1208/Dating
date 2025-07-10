// const to = require('await-to-js').default;
// const HttpUtil = require('../../utils/http');
// const PromptAnswer = require('../../shared-models/PromptAnswer');
// const Customer = require('../../shared-models/Customer');
// const HistoryProfile = require('../../shared-models/HistoryProfile');
// const Utils = require('../../utils');
// const BaseController = require('../../Base');

// class PromptController extends BaseController {
//   constructor() {
//     super(PromptController);

//     this.mPromptAnswer = PromptAnswer;
//     this.mHistoryProfile = HistoryProfile;
//     this.mCustomer = Customer;
//   }

//   /**
//    * Cập nhật Prompt answer
//    * @param {*} req
//    * @param {*} res
//    * @returns
//    */
//   async updatePromptAnswer(req, res) {
//     const requireParams = [
//       { name: 'id', dataType: 'string', acceptEmpty: true },
//       { name: 'codePrompt', dataType: 'string', acceptEmpty: true },
//       { name: 'answer', dataType: 'string' },
//     ];

//     let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
//     if (params.error) return HttpUtil.badRequest(res, params.error);

//     let authUser = req.authUser;

//     let [err, promptAnswer] = await to(
//       this.mPromptAnswer.getByIdsUserId(authUser._id),
//     );

//     let resultPrompt = {};

//     // Chưa tồn tại
//     if (!promptAnswer) {
//       let newPromptArray = [];
//       newPromptArray.push({
//         id: Utils.generateULID(),
//         codePrompt: params.codePrompt,
//         answer: params.answer,
//         order: 1,
//         insert: {
//           when: Date.now(),
//         },
//       });
//       const objPrompt = {
//         userId: authUser._id,
//         promptAnswers: newPromptArray,
//       };

//       const [errPromptAnswer, promptAnswer] = await to(
//         this.mPromptAnswer.insertObject(objPrompt),
//       );

//       if (errPromptAnswer) {
//         console.log('register insert prompt answer error', errPromptAnswer);
//       } else {
//         console.log('answer success');
//       }
//     } else {
//       const promptAnswerOld = promptAnswer.promptAnswers;

//       const findData = promptAnswerOld.find(x => x.id === params.id);
//       if (findData) {
//         if (promptAnswerOld.length > 3) {
//           return HttpUtil.internalServerError(res, {
//             msg: 'Errors.delete',
//             words: 'Max prompt',
//           });
//         } else {
//           const newArray = [];
//           newArray.push({
//             userId: authUser._id,
//             typeHistory: 1,
//             metaData: findData,
//           });
//           const [errPrompt, prompt] = await to(
//             this.mHistoryProfile.insertMulti(newArray),
//           );

//           if (errPrompt) {
//             console.log('insert prompt error', errPrompt);
//           } else {
//             console.log('prompt success');
//           }

//           // // update lại id đó
//           // (findData.codePrompt = params.codePrompt),
//           //   (findData.answer = params.answer);
//           // findData.update = {
//           //   when: Date.now(),
//           // };
//           let [err, result] = await to(
//             this.mPromptAnswer.updateItem(
//               { userId: authUser._id, 'promptAnswers.id': params.id },
//               {
//                 $set: {
//                   'promptAnswers.$.codePrompt': params.codePrompt,
//                   'promptAnswers.$.answer': params.answer,
//                 },
//               },
//             ),
//           );
//           resultPrompt = {
//             id: params.id,
//             codePrompt: params.codePrompt,
//             answer: params.answer,
//             order: findData.order,
//           };

//           if (err) {
//             console.log('register insert prompt answer error', err);
//           } else {
//             console.log('answer success');
//           }
//         }
//       } else {
//         if (promptAnswerOld.length === 3) {
//           return HttpUtil.internalServerError(res, {
//             msg: 'Errors.delete',
//             words: 'Max prompt',
//           });
//         } else {
//           // Tồn tại rồi
//           const objAnswer = {
//             id: Utils.generateULID(),
//             codePrompt: params.codePrompt,
//             answer: params.answer,
//             order: parseInt(promptAnswer.promptAnswers.length + 1),
//             insert: {
//               when: Date.now(),
//             },
//           };

//           resultPrompt = objAnswer;
//           promptAnswerOld.push(objAnswer);
//           let [err, result] = await to(
//             this.mPromptAnswer.updateOne(promptAnswer._id, {
//               promptAnswers: promptAnswerOld,
//             }),
//           );

//           if (err) {
//             console.log('register insert prompt answer error', err);
//           } else {
//             console.log('answer success');
//           }
//         }
//       }
//     }

//     return HttpUtil.success(res, resultPrompt, 'Success.update');
//   }

//   /**
//    * Xóa Prompt answer theo id
//    * @param {*} req
//    * @param {*} res
//    * @returns
//    */
//   async deletePromptAnswerById(req, res) {
//     const requireParams = [
//       { name: 'id', dataType: 'string', acceptEmpty: true },
//     ];

//     let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
//     if (params.error) return HttpUtil.badRequest(res, params.error);

//     let authUser = req.authUser;

//     let [err, promptAnswer] = await to(
//       this.mPromptAnswer.getByIdsUserId(authUser._id),
//     );

//     if (promptAnswer) {
//       // delete
//       const promptAnswerOld = promptAnswer.promptAnswers;

//       const findData = promptAnswerOld.filter(
//         x => x.id !== params.id,
//       );

//       const findExist = promptAnswerOld.filter(
//         x => x.id === params.id,
//       );

//       let newArray = [];

//       if (findData.length < promptAnswerOld.length) {
//         if (findExist) {
//           newArray.push({
//             userId: authUser._id,
//             typeHistory: 1,
//             metaData: findExist,
//           });
//         }
//         const [errPrompt, prompt] = await to(
//           this.mHistoryProfile.insertMulti(newArray),
//         );

//         if (errPrompt) {
//           console.log('insert prompt answer error', errPrompt);
//         } else {
//           console.log('answer success');
//         }
//         // Update
//         let [err, result] = await to(
//           this.mPromptAnswer.updateOne(promptAnswer._id, {
//             promptAnswers: findData,
//           }),
//         );

//         if (err) {
//           console.log('register insert prompt answer error', err);
//         } else {
//           console.log('answer success');
//         }
//       } else {
//         return HttpUtil.notFound(res, {
//           msg: 'Errors.delete',
//           words: `Not found id ${params.id}`,
//         });
//       }
//     } else {
//       return HttpUtil.internalServerError(res, {
//         msg: 'Errors.delete',
//         words: `Not found id ${params.id}`,
//       });
//     }

//     return HttpUtil.success(res, 'Success.Delete');
//   }
// }

// module.exports = new PromptController();
