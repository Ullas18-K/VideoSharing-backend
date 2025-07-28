import mongoose, { mongo } from "mongoose"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asynchandler } from "../utils/asyncHandler.js"
import { Comment } from "../models/comments.models.js"

//grab owner details

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

const getVideoComments = asynchandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "videoId not valid")
    }

    const comments = Comment.aggregate([
        {
            $match: {
                video: mongoose.Types.ObjectId(videoId)
            }
        },
        populateOwner(),
        unwindOwner(),//now ownerdetails will contain single object taken out from the array that looup returned
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                ownerDetails: 1
            }
        }
    ])

    const options = {
        page: Number(page),
        limit: Number(limit),
    }

    const final = await Comment.aggregatePaginate(comments, options)

    if (!final.docs.length) {
        throw new ApiError(404, "No comments on this video")
    }

    res.status(200).json(new ApiResponse(200, final.docs, "Comments fetched successfully"))
})

const addComment = asynchandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "videoId not valid")
    }

    const { commentContent } = req.body
    if (!commentContent || typeof commentContent !== "string" || commentContent.trim() === "") {
        throw new ApiError(400, "Comment content is required");
    }

    const newComment = await Comment.create({
        content: commentContent.trim(),
        video: mongoose.Types.ObjectId(videoId), //since videoId might be a string
        owner: req.user._id
    })

    if (!newComment) {
        throw new ApiError(500, "Something went wrong, try again!!")
    }

    res.status(200).json(new ApiResponse(200, newComment, "Comment added successfully"))
})

const updateComment = asynchandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }

    const { newcontent } = req.body
    if (!newcontent || typeof newcontent !== "string" || newcontent.trim() === "") {
        throw new ApiError(400, "Comment content is required");
    }

   const updatedComment = await Comment.findById(commentId)
   
   if (!updatedComment) {
       throw new ApiError(500, "Comment not found")
   }
   //owner auth
   if(!(updatedComment.owner.toString()===req.user._id.toString())){ //converting to string is imp
    throw new ApiError(403,"You're not authorized to edit this comment")
   }

    updatedComment.content = newcontent.trim()

   await updatedComment.save({validateBeforeSave:false})


    res.status(200).json(new ApiResponse(200, updatedComment, "Comment updated successfully"))
})

const deleteComment = asynchandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }

    const currcomment= await Comment.findOne({_id:commentId})

    if(!(currcomment.owner.toString()===req.user._id.toString())){
        throw new ApiError(403,"Not authorised to delete the comment")
    }

    const deletedComment= await Comment.findByIdAndDelete(commentId)

    if(!deletedComment){
        throw new ApiError(400,"Comment not found or already deleted")
    }

    res.status(200).json(new ApiResponse(200,deletedComment,"Comment deleted successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}