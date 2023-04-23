import asyncHandler from "../service/asyncHandler.js";
import CustomError from "../utils/customError.js";
import User from "../models/user.schema.js";

export const cookieOptions = {
  expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  httpOnly: true,
};

/******************************************************
 * @SIGNUP
 * @route http://127.0.0.1:27017/api/auth/signup
 * @description User signUp Controller for creating new user
 * @returns User Object
 ******************************************************/

export const singUp = asyncHandler(async (req, res) => {
  // get data for user
  const { name, email, password } = req.body;

  // validation
  if (!name || !email || !password) {
    throw new CustomError("Please fill all fields", 400);
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new CustomError("User already exists", 400);
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  const token = user.getJWTtoken();
  //safety
  user.password = undefined;

  //store this token in user's cookie
  res.cookie("token", token, cookieOptions);

  // send back a response to user
  res.status(200).json({
    success: true,
    token,
    user,
  });
});

/*********************************************************
 * @LOGIN
 * @route http://localhost:5000/api/auth/login
 * @description User Login Controller for signing in the user
 * @returns User Object
 *********************************************************/

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  //validation
  if (!email || !password) {
    throw new CustomError("PLease fill all details", 400);
  }

  const user = User.findOne({ email }).select("+password");

  if (!user) {
    throw new CustomError("Invalid credentials", 400);
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (isPasswordMatched) {
    const token = user.getJWTtoken();
    user.password = undefined;
    res.cookie("token", token, cookieOptions);
    return res.status(200).json({
      success: true,
      token,
      user,
    });
  }

  throw new CustomError("Password is incorrect", 400);
});

/**********************************************************
 * @LOGOUT
 * @route http://localhost:5000/api/auth/logout
 * @description User Logout Controller for logging out the user
 * @description Removes token from cookies
 * @returns Success Message with "Logged Out"
 **********************************************************/

export const logout = asyncHandler(async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

/**********************************************************
 * @GET_PROFILE
 * @route http://localhost:5000/api/auth/profile
 * @description check token in cookies, if present then returns user details
 * @returns Logged In User Details
 **********************************************************/

export const getProfile = asyncHandler(async (req, res) => {
  const { user } = req;

  if (!user) {
    throw new CustomError("User not found", 401);
  }

  res.status(200).json({
    success: true,
    user,
  });
});
