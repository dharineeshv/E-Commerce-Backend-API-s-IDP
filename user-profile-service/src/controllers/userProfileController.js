import * as userProfileService from "../services/userProfileService.js";

const createProfile = async (req, res, next) => {
  try {
    const result = await userProfileService.createProfile(req.body);

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getProfileBySub = async (req, res, next) => {
  try {
    const { cognitoSub } = req.params;

    const result = await userProfileService.getProfileBySub(cognitoSub);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export {
  createProfile,
  getProfileBySub,
};