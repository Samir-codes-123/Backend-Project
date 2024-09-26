import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    // adding refresh token  to db
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // dont need pass or any validation to save in db

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
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

const loginUser = asyncHandler(async (req, res) => {
  // req.body--> data
  // username or password checking
  // find the user in db
  // check password
  // generate access token and refresh
  // send cookie with tokens

  const { username, email, password } = req.body;
  if (!(username || email))
    // can login with either email or username
    throw new ApiError(400, "Username or email is required!");

  const user = await User.findOne({
    // doesnt consist refresh token
    $or: [{ username }, { email }], // find one from either value provided
  });

  if (!user) throw new ApiError(404, "User doesnt exists");

  // use user not User
  const isPassValid = await user.isPasswordCorrect(password);
  if (!isPassValid) throw new ApiError(401, "Invalid user credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // can also simply add to user by user.refToken decide according to cost
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); // excludes keys from objects given in -

  const options = {
    // only modifiable by server and not frontend
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options) // from cookie parser
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const userID = req.user._id; // from middle ware
  await User.findByIdAndUpdate(
    userID,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true, // sets new value for all devices
    }
  );

  const options = {
    // only modifiable by server and not frontend
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // for refreshing accesss and refresh token
  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incommingRefreshToken) throw new ApiError(401, "Unauthorized request");

  try {
    // tokens are encrypted
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) throw new ApiError(401, "Invalid refresh token");

    // match the refresh token saved earlier and incomming from cookie
    if (user?.refreshToken !== incommingRefreshToken)
      throw new ApiError(401, "Refresh token is expired or invalid");

    const options = {
      // only modifiable by server and not frontend
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options) // from cookie parser
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token refresh successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPassCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPassCorrect) throw new ApiError(400, "Invalid old password");

  user.password = newPassword; // set
  await user.save({ validateBeforeSave: false }); //save
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res // auth middleware provides user
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  // send both logic
  if (!fullname || !email) throw new ApiError(400, "All field are required");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    { new: true }
  ).select("-password"); // returns new values

  return res
    .status(200)
    .json(
      new ApiResponse(200, { user }, "Account details updated successfully")
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // req.body= avatar from multer
  // delete from cloudinary  old avatar
  // create or upload to cloudinary
  //find and update in user mongodb

  // dont need files since one value is only expected
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) throw new ApiError(400, "Avatar is missing");

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) throw new ApiError(400, "Error while uploading avatar");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { avatar: avatar.url },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverLocalPath = req.file?.path;
  if (!coverLocalPath) throw new ApiError(400, "Cover image is missing");

  const coverImage = await uploadOnCloudinary(coverLocalPath);
  if (!coverImage) throw new ApiError(400, "Error while uploading cover image");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { coverimage: coverImage.url },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
