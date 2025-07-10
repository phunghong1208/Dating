'use strict';

const { default: to } = require('await-to-js');
const BaseController = require('./BaseController');
const Model = require('../models/Customer');
const Image = require('../models/Image');

const Configs = require('../../config');

/*
  Xem hàm mẫu BaseController nếu muốn viết lại các action
*/
class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.model = Model;
    this.mImage = Image;
    this.selection = {};
  }

  async index(req, res) {
    let options = await this.handleFilter(req);
    let [err, rs] = await to(this.model.getForApproveImages(options));
    if (err)
      return this.throwInternalError(res, {
        msg: 'Errors.Load_Lists_Failed',
        words: err.message,
      });
    return this.success(res, { data: rs });
  }

  async getNeedConfirmLists(req, res) {
    let options = await this.handleFilter(req);
    let [err, rs] = await to(this.model.getForApproveImages(options));
    if (err)
      return this.throwInternalError(res, {
        msg: 'Errors.Load_Lists_Failed',
        words: err.message,
      });
    return this.success(res, { data: rs });
  }

  async getListCardImage(req, res) {
    let params = this.getRequiredParams2(req, [
      {
        name: 'statusReview',
        dataType: 'number',
        acceptEmpty: false,
      },
      {
        name: 'statusAI',
        dataType: 'number',
        acceptEmpty: false,
      },
    ]);

    if (params.error) return this.throwBadRequest(res, params.error);
    let options = await this.handleFilter(req);
    let [err, rs] = await to(this.mImage.getForCardImage(options, params));
    if (err)
      return this.throwInternalError(res, {
        msg: 'Errors.Load_Lists_Failed',
        words: err.message,
      });
    return this.success(res, { data: rs });
  }

  async getListHistoryImageByUser(req, res) {
    let params = this.getRequiredParams2(req, [
      {
        name: 'statusReview',
        dataType: 'number',
        acceptEmpty: false,
      },
      {
        name: 'statusAI',
        dataType: 'number',
        acceptEmpty: false,
      },
    ]);

    if (params.error) return this.throwBadRequest(res, params.error);
    let options = await this.handleFilter(req);
    let [err, rs] = await to(
      this.mImage.getHistoryImageByUsers(options, params, req),
    );
    if (err)
      return this.throwInternalError(res, {
        msg: 'Errors.Load_Lists_Failed',
        words: err.message,
      });
    return this.success(res, { data: rs });
  }

  async getTotalCardImagesCMS(req, res) {
    let [err, rs] = await to(this.mImage.getTotalImageUsers());
    if (err)
      return this.throwInternalError(res, {
        msg: 'Errors.Load_Lists_Failed',
        words: err.message,
      });
    return this.success(res, { data: rs });
  }

  async updateStatusAvatar(req, res) {
    let params = this.getRequiredParams2(req, [
      'avatarId',
      {
        name: 'imageId',
        dataType: 'string',
        acceptEmpty: true,
      },
      {
        name: 'reviewerStatus',
        dataType: 'number',
        acceptValues: Object.values(Configs.avatars.status),
      },
      {
        name: 'comment',
        dataType: 'string',
        acceptEmpty: true,
      },
      {
        name: 'reviewerViolateOption',
        dataType: 'array',
        acceptEmpty: true,
      },
    ]);

    if (params.error) return this.throwBadRequest(res, params.error);

    // const { avatarId } = params;
    // console.log('params', params);

    // let user = await this.model.getByAvatar(avatarId);
    // if (!user)
    //   return this.throwBadRequest(`No users found with avatar id: ${avatarId}`);

    await this.mImage.updateImageStatus(params, req.authUser);

    return this.success(res, 'Success.general');
  }

  /**
   * Ctrl update status image reviewer
   * @param {*} req
   * @param {*} res
   * @returns
   */
  // async manualUpdateAvatarStatus(req, res) {
  //   let params = this.getRequiredParams2(req, [
  //     'avatarId',
  //     {
  //       name: 'reviewerStatus',
  //       dataType: 'number',
  //       acceptValues: Object.values(Configs.avatars.status),
  //     },
  //     {
  //       name: 'comment',
  //       dataType: 'string',
  //       acceptEmpty: true,
  //     },
  //     {
  //       name: 'reviewerViolateOption',
  //       dataType: 'array',
  //       acceptEmpty: true,
  //     },
  //   ]);

  //   if (params.error) return this.throwBadRequest(res, params.error);

  //   const { avatarId } = params;
  //   console.log('params', params);

  //   let user = await this.model.getByAvatar(avatarId);
  //   if (!user)
  //     return this.throwBadRequest(`No users found with avatar id: ${avatarId}`);

  //   await this.model.updateAvatarStatus(user, params, req.authUser);

  //   return this.success(res, 'Success.general');
  // }

  async resetAvatarStatus(req, res) {
    let params = this.checkRequiredParams2(req.params, ['avatarId']);
    if (params.error) return this.throwBadRequest(res, params.error);

    const { avatarId } = params;
    let user = await this.model.getByAvatar(avatarId);
    if (!user)
      return this.throwBadRequest(
        res,
        `No users found with avatar id: ${avatarId}`,
      );

    await this.model.updateAvatarStatus(
      user,
      avatarId,
      Configs.avatars.status.pending,
      req.authUser,
    );

    return this.success(res, 'Success.general');
  }
}

module.exports = new Controller();
