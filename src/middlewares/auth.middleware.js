import { User } from "../models/user.model.js";
import ApiError from "../utils/Apierrors.js";
import { asynchandler } from "../utils/asyncHandler.js";
import Jwt from "jsonwebtoken"


export const verifyJWT = asynchandler(async (req, res, next) => { //using 'next' since it's a middleware ,so that it'll execute the next middleware/method in the route 

    try {
        //first get the accesstoken from cookies or headers which are automatically sent for each req
    const token = req.cookies?.AccessTokenJWT || req.header("Authorization")?.replace("Bearer ", "")
    //headers can be sent by mobile apps 
    //headers--> key value pairs ex: "Authorization": Bearer <secret token> , since we only need token we just replace it w null
    if(!token){
        throw new ApiError(401,"Unauthorized Request");
        
    }
    const decodeJWT =await Jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const currUser = await User.findById(decodeJWT?.user_id).select("-password -RefreshTokens") //from payload
    if(!currUser){
        throw new ApiError(404,"User not found");
    }
    req.user = currUser; //now req for the next middleware/method will have .user object along with .body and others
    next()
    } catch (error) {
        throw new ApiError(404,error?.message || "Invalid token")
    }
})