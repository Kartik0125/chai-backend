import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
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

export { registerUser }