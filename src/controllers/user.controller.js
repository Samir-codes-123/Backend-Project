import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";
export const registerUser = asyncHandler(async (req, res) => {
  // user detail retrieve from frontend
  // validation accoridng to usermodel -- not empty
  // check if user exist: from username,email
  // check for images,check for avatar (required)
  // upload them to cloudinary,avatar
  // create user object for mongodb - create entry in db
  // remove password and refresh token field from response
  // check for usercreation
  // return response

  const { username, email, fullname, password } = req.body; // contains data from frontend
  // console.log("Email: ", email);
  // console.log("data", req.body);

  if (
    [username, email, fullname, password].some((field) => field?.trim() === "") // checks condtion for all values of arrays and return boolean
  ) {
    throw new ApiError(400, `All fields are required`);
  }

  // since user is mongoose schema it can interact with mongodb
  const existedUser = await User.findOne({
    // search and returns boolean
    $or: [{ username }, { email }], // or condtion
  });

  if (existedUser) {
    // moving the upload to cloudinary at first because it is not getting removed if user is already existing
    throw new ApiError(409, "User already exists with username or email");
  }

  // console.log("multer", req.files); //contains item from multer

  const avatarLocalPath = req.files?.avatar[0]?.path; // where image is saved in multer
  //const coverimageLocalPath = req.files?.coverimage[0]?.path;// this is causing undefined error

  let coverimageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverimage) &&
    req.files.coverimage.length > 0
  ) {
    coverimageLocalPath = req.files.coverimage[0].path;
  }

  // avatar is required
  if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required");

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  // console.log(avatar);

  const coverimage = await uploadOnCloudinary(coverimageLocalPath);

  if (!avatar) throw new ApiError(400, "Avatar file is required");

  // db entry in json
  const user = await User.create({
    fullname,
    email,
    avatar: avatar.url, // returns full response take only url
    coverimage: coverimage?.url || "", // since we havent checked for this
    password,
    username: username.toLowerCase(),
  });

  const isUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); // excludes keys from objects given in -

  if (!isUser)
    throw new ApiError(500, "Something went wrong while registering user");

  return res
    .status(201)
    .json(new ApiResponse(200, isUser, "User register successfully"));
});
