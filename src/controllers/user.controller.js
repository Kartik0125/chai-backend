import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessTokenAndRefreshTokens = async (userId)=>{
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false});

        return {accessToken,refreshToken};

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating Access And Refresh Token!!!")
    }
}

const registerUser = asyncHandler( async (req,res)=>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username or email
    // check for images,check for avatar
    // upload them into cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response 
    // check for user creation
    // return res


    // Step1
    const {userName,email,fullName,password}=req.body
    console.log(req.body);

    // Step2
    if([userName,email,fullName,password].some((field)=>field?.trim() === ""))
    {
        throw new ApiError(400,"All Fields are Required!!!");
    }
    const existedUser = await User.findOne(
        {
            $or:[{ userName },{ email }]
        }
    )

    console.log(existedUser);

    if(existedUser)
    {
        throw new ApiError(409,"User with username or email already exists!!!");
    }

    console.log(req.files);
    
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
    {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath)
    {
        throw new ApiError(409,"Avatar File is required!!!");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar)
    {
        throw new ApiError(409,"Avatar File is not uploaded!!!");
    }

    const user = await User.create({
        userName:userName.toLowerCase(),
        email,
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url||"",
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    console.log(createdUser);
    if(!createdUser)
    {
        throw new ApiError(500,"Something went wrong while registering the user!!!")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Successfully!!!")
    )
} )

const loginUser = asyncHandler( async (req,res)=>{
    // user enter username or email, password
    // server validate credentials
    // server gives the access token and refresh token to user
    // send cookie(tokens)

   const {userName,email,password} = req.body;
   
   if(!(userName || !email))
   {
    throw new ApiError(400,"userName or email is required to Login!!!");
   }

   const user = await User.findOne({
    $or:[{userName},{email}]
   })

   if(!user)
   {
    throw new ApiError(404,"User does not exist!!!")
   }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if(!isPasswordValid)
  {
    throw new ApiError(401,"Password is incorrect!!!")
  }

  const {accessToken,refreshToken} = await generateAccessTokenAndRefreshTokens(user._id);
  user.password = undefined;
  user.refreshToken = undefined;

const options = {
    httpOnly:true,
    secure:true
}

return res
.status(200)
.cookie("AccessToken",accessToken,options)
.cookie("RefreshToken",refreshToken,options)
.json(
    new ApiResponse(200,{user:user,accessToken,refreshToken},"Login Successfull!!!")
)
})

const logOutUser = asyncHandler(async (req,res)=>{
   await User.findByIdAndUpdate(
    req.user._id,
    {
        $set:{
            refreshToken : undefined
        }
    },
    {
        new:true
    }
   ) 

   options = {
    httpOnly:true,
    secure:true
   }

   return res
   .status(200)
   .clearCookie("AccessToken",options)
   .clearCookie("RefreshToken",options)
   .json(
    new ApiResponse(200,{},"User LoggedOut Successfully!!!")
   )
})
export { registerUser, loginUser, logOutUser }