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


const getMyProfile = async (req, res, next) => {
  try {
    const cognitoSub = req.user ? (req.user.sub || req.user.username) : null;
    const email = req.user ? (req.user.email || req.user.username) : null;
    const name = req.user ? (req.user.name || req.user.given_name || (email ? email.split('@')[0] : null)) : null;

    const result = await userProfileService.getMyProfile(cognitoSub, email, name);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


const updateMyProfile = async (req, res, next) => {
  try {
    const cognitoSub = req.user.sub;

    const result = await userProfileService.updateMyProfile(
      cognitoSub,
      req.body
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getProfileByCustomerId = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const result = await userProfileService.getProfileByCustomerId(customerId);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const result = await userProfileService.updateProfile(
      customerId,
      req.body
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteProfile = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const result = await userProfileService.deleteProfile(customerId);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getAllProfiles = async (req, res, next) => {
  try {
    const result = await userProfileService.getAllProfiles();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export {
  createProfile,
  getProfileBySub,
  getMyProfile,
  updateMyProfile,
  getProfileByCustomerId,
  updateProfile,
  deleteProfile,
  getAllProfiles,
};