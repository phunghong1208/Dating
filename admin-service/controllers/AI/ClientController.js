'use strict';

const to = require('await-to-js').default;
const HttpUtil = require('../../utils/http');
const BaseController = require('../../Base');
const Customer = require('../../models/Customer');
const Image = require('../../models/Image');

const { AI_API_KEY } = require('../../../config/ai.json');
const Configs = require('../../../config');

const ServiceSocket = require('../../services/socket');
const { forEach } = require('lodash');

class ClientController extends BaseController {
  constructor() {
    super(ClientController);
    this.model = Customer;
    this.mImage = Image;
  }

  async verified(req, res) {
    const apiHashKey = req.headers['api-key'];
    if (!apiHashKey || apiHashKey !== AI_API_KEY)
      return HttpUtil.forbidden(res, 'Invalid secret key!');

    const requireParams = [
      'uid',
      { name: 'verified', dataType: 'boolean' },
      { name: 'imageIds', dataType: 'array', acceptEmpty: true },
    ];
    let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);

    let { uid, verified, imageIds } = params;
    let [err, user] = await to(this.model.getById(uid));
    if (err) return HttpUtil.internalServerError(res, err.message || err);
    if (!user)
      return HttpUtil.badRequest(res, { msg: 'Not_Exists.user', words: uid });

    if (imageIds.length !== 0 && verified === true) {
      // update explore
      let { explore = {} } = user;
      explore.verified = 2;
      await this.model.updateOne(user._id, { explore }, {}, user);
      console.log("AI xác thuc thanh cong", verified);
      ServiceSocket.emitEventUserVerified(uid, { verified: 2 });

      // update isVerified Image
      let [err, imageData] = await to(this.mImage.getByIdsUserId(uid));
      if (err)
        return HttpUtil.internalServerError(res, {
          msg: 'image_save_failed',
          words: err.message,
        });
      if (imageData) {
        imageIds.forEach(element => {
          this.mImage.updateItem(
            { _id: imageData._id, 'avatars.id': element },
            {
              $set: {
                'avatars.$.isVerified': true,
              },
            },
          );
        });
      }
    } else {
      let { explore = {} } = user;
      explore.verified = -1;
      console.log("AI xác thuc khong thanh cong", verified);
      await this.model.updateOne(user._id, { explore }, {}, user);
      ServiceSocket.emitEventUserVerified(uid, { verified: -1 });
    }

    // socket emit user-verified
    return HttpUtil.success(res, 'Success.general');
  }

  async aiUpdatePhotos(req, res) {
    const apiHashKey = req.headers['api-key'];
    if (!apiHashKey || apiHashKey !== AI_API_KEY)
      return HttpUtil.forbidden(res, 'Invalid secret key!');

    const requireParams = [
      'uid',
      { name: 'avatars', dataType: 'array', acceptEmpty: false },
    ];
    let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);

    let { uid, avatars } = params;
    let [err, user] = await to(this.model.getById(uid));
    if (err) return HttpUtil.internalServerError(res, err.message || err);
    if (!user)
      return HttpUtil.badRequest(res, { msg: 'Not_Exists.user', words: uid });
    [err, user] = await to(this.mImage.getByIdsUserId(user._id));
    if (user.avatars.length !== avatars.length) {
      return HttpUtil.internalServerError(res, 'Not enough photos');
    }
    avatars.forEach(async (element, index) => {
      await this.mImage.findOneAndUpdate(
        { userId: user.userId, 'avatars.id': element },
        {
          $set: {
            'avatars.$.order': index,
          },
        },
        { new: true, useFindAndModify: false },
      );
    });

    return HttpUtil.success(res, 'Success.general');
  }

  async aiUpdateStatusImage(req, res) {
    const apiHashKey = req.headers['api-key'];
    if (!apiHashKey || apiHashKey !== AI_API_KEY)
      return HttpUtil.forbidden(res, 'Invalid secret key!');

    const requireParams = [
      'avatarId',
      {
        name: 'aiStatus',
        dataType: 'number',
        acceptValues: Object.values(Configs.avatars.status),
      },
      {
        name: 'aiPoint',
        dataType: 'number',
        acceptEmpty: true,
      },
      {
        name: 'aiViolateOption',
        dataType: 'array',
        acceptEmpty: true,
      },
    ];
    let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);
    await this.mImage.updateAvatarStatusAI(params);

    return HttpUtil.success(res, 'Success.general');
  }

  async getProfileWithoutAuth(req, res) {
    const apiHashKey = req.headers['api-key'];
    if (!apiHashKey || apiHashKey !== AI_API_KEY)
      return HttpUtil.forbidden(res, 'Invalid secret key!');

    let { uid } = req.params;
    if (!uid) return HttpUtil.badRequest(res, 'Param uid is required');

    let [err, user] = await to(this.model.getById(uid));
    if (err) return HttpUtil.internalServerError(res, err.message || err);
    if (!user)
      return HttpUtil.badRequest(res, { msg: 'Not_Exists.user', words: uid });
    user = this.model.getProfiles(user);
    return HttpUtil.success(res, user);
  }
}

module.exports = new ClientController();
