import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken";

const verifyJWT = async(req,_,next)=>{

   try {
     const token = req.cookies?.AccessToken || req.header("Authorization")?.replace("Bearer ", "")
     console.log(req.cookies);
     
     if(!token)
     {
         throw new ApiError(401,"Unauthorised Access!!!")
     }
 
     const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
 
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
 
     if(!user)
     {
         // discussion
         throw new ApiError(401,"Invalid Token!!!")
     }
 
     req.user=user;
     next()
   } catch (error) {
    throw new ApiError(401,error?.message || "Invalid Token!!!")
   }
}

export {verifyJWT}