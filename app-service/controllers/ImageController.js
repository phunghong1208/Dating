'use strict';

const to = require('await-to-js').default;
const HttpUtil = require('../utils/http');
const Utils = require('../utils');
const BaseController = require('../Base');
const Image = require('../models/Image');
const HistoryProfile = require('../models/HistoryProfile');

class ImageController extends BaseController {
  constructor() {
    super(ImageController);
    this.imageModel = Image;
    this.historyProfileModel = HistoryProfile;
  }

  async getProfileImage(req, res) {
    let authUser = req.authUser;

    let [err, data] = await to(this.imageModel.getImagesByUserId(authUser._id));

    if (!authUser || !authUser._id) {
      return HttpUtil.unauthorized(res, 'unauthorized');
    }
    return HttpUtil.success(res, data);
  }

  /**
   * Delete images
   * @param {*} req
   * @param {*} res
   * @returns
   * Update by: nvduc
   */
  async deleteProfileImage(req, res) {
    let authUser = req.authUser;

    if (!authUser || !authUser._id) {
      return HttpUtil.unauthorized(res, 'unauthorized');
    }

    const requireParams = ['imageId'];

    const optionParams = [];

    // let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
    let params = HttpUtil.getRequiredParamsFromJson2(req, [
      ...requireParams,
      ...optionParams,
    ]);
    if (params.error) return HttpUtil.badRequest(res, params.error);
    params = Utils.getAcceptableFields(params, [
      ...requireParams,
      ...optionParams,
    ]);

    let [err, imageData] = await to(
      this.imageModel.getByIdsUserId(authUser._id),
    );

    if (imageData) {
      const listId = params?.imageId;
      let newArray = [];

      if (listId && listId?.length > 0) {
        listId.forEach(element => {
          const findData = imageData.avatars.find(x => x.id === element);

          if (findData) {
            newArray.push({
              userId: authUser._id,
              typeHistory: 0,
              metaData: findData,
            });
          }
        });

        const [errImage, image] = await to(
          this.historyProfileModel.insertMulti(newArray),
        );

        if (errImage) {
          console.log('register insert image error', errImage);
        } else {
          console.log('image success');
        }
        const filter = { _id: imageData._id };

        const update = {
          $pull: {
            avatars: { id: { $in: listId } },
          },
        };

        const [error, result] = await to(
          this.imageModel.updateManyArray(filter, update),
        );
        if (error)
          return HttpUtil.internalServerError(res, {
            msg: 'image_save_failed',
            words: error.message,
          });
      } else {
        return HttpUtil.notFound(res, {
          msg: 'Errors.delete',
          words: 'Images not array empty',
        });
      }
    }

    return HttpUtil.success(res, 'Success.delete');
  }

  /**
   * Update image profileI
   * @param {*} req
   * @param {*} res
   * @returns
   */
  async updateProfileImage(req, res) {
    const requireParams = [
      { name: 'idImage', dataType: 'string', acceptEmpty: true },
      { name: 'url', dataType: 'string', acceptEmpty: true },
      { name: 'thumbnails', dataType: 'array', acceptEmpty: true },
      { name: 'order', dataType: 'number' },
    ];

    let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);

    let authUser = req.authUser;

    let [err, imageData] = await to(
      this.imageModel.getByIdsUserId(authUser._id),
    );

    if (imageData) {
      let newArray = [];
      const findData = imageData.avatars.find(x => x.id === params.idImage);

      if (findData) {
        newArray.push({
          userId: authUser._id,
          typeHistory: 0,
          metaData: findData,
        });
      }
      const [errImage, image] = await to(
        this.historyProfileModel.insertMulti(newArray),
      );

      if (errImage) {
        console.log('insert image error', errImage);
      } else {
        console.log('image success');
      }

      let [err, result] = await to(
        this.imageModel.updateItem(
          { _id: imageData._id, 'avatars.id': params.idImage },
          {
            $set: {
              'avatars.$.meta.url': params.url,
              'avatars.$.meta.thumbnails': params.thumbnails,
              'avatars.$.reviewerStatus': 0,
              'avatars.$.order': params.order,
              'avatars.$.reviewerViolateOption': [],
              'avatars.$.aiStatus': 0,
              'avatars.$.aiViolateOption': [],
              'avatars.$.aiPoint': 0,
            },
          },
        ),
      );

      if (err) {
        console.log('update imageI error', err);
      } else {
        console.log('update image success');
      }
    }
    return HttpUtil.success(res, 'Success.update');
  }

  /**
   * Add image user
   * @param {*} req
   * @param {*} res
   * @returns
   */
  async addProfileImage(req, res) {
    let authUser = req.authUser;

    if (!authUser || !authUser._id) {
      return HttpUtil.unauthorized(res, 'unauthorized');
    }

    const requireParams = ['images'];

    const optionParams = [];

    // let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
    let params = HttpUtil.getRequiredParamsFromJson2(req, [
      ...requireParams,
      ...optionParams,
    ]);
    if (params.error) return HttpUtil.badRequest(res, params.error);
    params = Utils.getAcceptableFields(params, [
      ...requireParams,
      ...optionParams,
    ]);

    let [err, imageData] = await to(
      this.imageModel.getByIdsUserId(authUser._id),
    );

    if (imageData) {
      let imageDataOld = imageData.avatars;
      let avatars = params.images;
      let newImageArr = [];

      if (avatars && avatars?.length > 0) {
        for (let i = 0; i < avatars.length; i++) {
          newImageArr.push({
            id: Utils.generateULID(),
            meta: {
              url: avatars[i]?.url,
              thumbnails: avatars[i]?.thumbnails,
            },
            reviewerStatus: 0, // 0: pending / 1: accepted / 2: rejected
            order: avatars[i]?.order,
            comment: '',
            reviewerViolateOption: [],
            aiStatus: 0,
            aiViolateOption: [],
            aiPoint: 0,
            insert: {
              when: Date.now(),
            },
          });
        }

        let imageArrayNew = [...imageDataOld, ...newImageArr];
        const update = {
          $addToSet: {
            avatars: { $each: newImageArr },
          },
        };
        if (imageArrayNew.length <= 9) {
          let [err, result] = await to(
            this.imageModel.updateOneData({ _id: imageData._id }, update),
          );
          if (err) {
            console.log('register insert prompt image error', err);
          } else {
            console.log('image success');
          }
        } else {
          return HttpUtil.internalServerError(res, {
            msg: 'Errors.update',
            words: `Max Image ${imageArrayNew.length}`,
          });
        }
      } else {
        return HttpUtil.internalServerError(res, {
          msg: 'Errors.update',
          words: 'Images not array empty',
        });
      }
    }

    return HttpUtil.success(res, 'Success.update');
  }

  async changeProfileImageOrder(req, res) {
    let authUser = req.authUser;

    if (!authUser || !authUser._id) {
      return HttpUtil.unauthorized(res, 'unauthorized');
    }

    const requireParams = ['images'];

    const optionParams = [];

    // let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
    let params = HttpUtil.getRequiredParamsFromJson2(req, [
      ...requireParams,
      ...optionParams,
    ]);
    if (params.error) return HttpUtil.badRequest(res, params.error);
    params = Utils.getAcceptableFields(params, [
      ...requireParams,
      ...optionParams,
    ]);

    let [err, imageData] = await to(
      this.imageModel.getByIdsUserId(authUser._id),
    );

    if (imageData) {
      const avatars = params.images;
      if (avatars && avatars?.length > 0) {
        for (let i = 0; i < avatars.length; i++) {
          let [err, result] = await to(
            this.imageModel.updateItem(
              { _id: imageData._id, 'avatars.id': avatars[i].id },
              {
                $set: {
                  'avatars.$.order': avatars[i].order,
                },
              },
            ),
          );

          if (err) {
            console.log('update imageI error', err);
          } else {
            console.log('update image success');
          }
        }
      }
    }
    return HttpUtil.success(res, 'Success.update');
  }
}

module.exports = new ImageController();
