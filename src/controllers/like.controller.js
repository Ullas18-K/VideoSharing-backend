import mongoose, { isValidObjectId } from "mongoose"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asynchandler } from "../utils/asyncHandler.js"
import { Like } from "../models/likes.models.js"

const populateOwner = () => {
    return {
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails",
            pipeline: [{
                $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1
                }
            }]
        }
    }
}
const unwindOwner = () => {
    return {
        $unwind: { // unwind breaks up the array of items into single objects
            path: "$ownerDetails",
            preserveNullAndEmptyArrays: true //to avoid crashes if owner does'nt exist by placing Null
        }
    };
};

const toggleVideoLike = asynchandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    //check for existing like
    let message = ""
    const existingLike = await Like.findOne({
        likedBy: req.user._id,
        targetId: videoId,
        targetType: "Video"
    })

    if (existingLike) {
        //unliked
        await Like.findByIdAndDelete(existingLike._id)
        message = "Video Unliked"
    }
    else {
        //like
        await Like.create({
            likedBy: req.user._id,
            targetId: videoId,
            targetType: "Video"
        })
        message="Video Liked"
    }

    res.status(200).json(new ApiResponse(200,{},message))
})

const toggleCommentLike = asynchandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }

    //check for existing like
    let message = ""
    const existingLike = await Like.findOne({
        likedBy: req.user._id,
        targetId: commentId,
        targetType: "Comment"
    })

    if (existingLike) {
        //unliked
        await Like.findByIdAndDelete(existingLike._id)
        message = "Comment Unliked"
    }
    else {
        //like
        await Like.create({
            likedBy: req.user._id,
            targetId: commentId,
            targetType: "Comment"
        })
        message="Comment Liked"
    }

    res.status(200).json(new ApiResponse(200,{},message))

})

const toggleTweetLike = asynchandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    //check for existing like
    let message = ""
    const existingLike = await Like.findOne({
        likedBy: req.user._id,
        targetId: tweetId,
        targetType: "Tweet"
    })

    if (existingLike) {
        //unliked
        await Like.findByIdAndDelete(existingLike._id)
        message = "Tweet Unliked"
    }
    else {
        //like
        await Like.create({
            likedBy: req.user._id,
            targetId: tweetId,
            targetType: "Tweet"
        })
        message="Tweet Liked"
    }

    res.status(200).json(new ApiResponse(200,{},message))
}
)

const getLikedVideos = asynchandler(async (req, res) => {
    //TODO: get all liked videos
    const {page = 1, limit = 10}=req.query

    const likedVideos= Like.aggregate([
        {
            $match:{
                likedBy:req.user._id,
                targetType:"Video"
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"targetId",
                foreignField:"_id",
                as:"videos",
                pipeline:[
                    populateOwner(),
                    unwindOwner(),
                    {
                        $sort:{
                            views:-1
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$videos"
        },
        {
            $project:{
                videos:1
            }
        }
    ])

   const options = {
           page: Number(page),
           limit: Number(limit),
       }
   
       const final = await Like.aggregatePaginate(likedVideos, options)
       
       if(!final.docs.length){
        throw  new ApiError(404, "No liked videos")
       }
       res.status(200).json(new ApiResponse(200,final.docs,"Liked videos fetched"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}