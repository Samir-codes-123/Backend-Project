import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // if cookie not present then use header mostly for mobile dev
    // from cookie parser
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", ""); // auth has Bearer <token> so replace to get token only

    if (!token) throw new ApiError(401, "Unauthorized request");

    // decodes all the item we send using jwt.sign in models
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id).select(
      "-password  -refreshToken"
    );

    if (!user) {
      //TODO disccusion
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user; // add user object to request so it can access id for logout
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});
