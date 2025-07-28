import { asynchandler } from "../utils/asyncHandler";
import { Video } from "../models/video.model";
import ApiResponse from "../utils/Apiresponse";
import ApiError from "../utils/Apierrors";
import uploadOnCloudinary from "../utils/cloudinary";
import mongoose, { mongo } from "mongoose";
import upload from "../middlewares/multer.middleware";
import { extractPublicId } from "../utils/ExtractPublicID.cloudinary";
import { v2 as cloudinary } from "cloudinary";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary";

const getAllVideos = asynchandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    //first we'll define what to add in match stage. the fields should match the video model
    const matchStage = {}

    if (query) {
        //to match a particular title 
        matchStage.title = { //standard search procedure in mongoDB 
            $regex: query, //stands for regular expression which looks for the matching string in a particular field in a doc
            $options: "i" //to specify whether to perform case sensitive or insensitive(like here) search
        }
    }

    if (userId) {
        matchStage.Owner = userId
    }

    if (typeof query !== "string") {
        query = "";
    }

    if (!["asc", "desc"].includes(sortType)) {
        sortType = "desc";
    }

    const sortStage = { //for sorting(sorting can be done by many fields so defined in array(sortBy))
        [sortBy]: sortType === "asc" ? 1 : -1
    }

    const aggregatedVideos = Video.aggregate([ //dont put await coz it's gonna destructure the result into array instead we need an aggregate object(the pipeline)
        {
            $match: matchStage
        },
        {
            $sort: sortStage
        },
        {
            $lookup: {
                from: "users",
                localField: "Owner",
                foreignField: "_id",
                as: "OwnerDetails", //this new field will be added to each video doc 
                pipeline: [//this pipeline applys to OwnerDetails field in each video doc
                    //this will also return an array the follwing details to ownerdeatails field
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        { //since owner details gets an array of projected details fro subpipeline(though it's only one doc), for frontend easisness were gonna just add the first element to separate field
            $addFields: {
                ownerD: {
                    $first: "$OwnerDetails"
                }
            }
        }
    ])

    const options = {
        page: Number(page),
        limit: Number(limit),
        sort: sortStage
    }

    const final = await Video.aggregatePaginate(aggregatedVideos, options) //the aggregatepaginate expects an pipeline or aggregate object(query) not the result along with instructions for pagination(objects)

    if (!final.docs || final.docs.length === 0) {
        throw new ApiError(404, "No Videos Found")
    }

    res.status(200).json(new ApiResponse(200, final, "Videos fetched sucessfully"))


})

const publishAVideo = asynchandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    const videoLocalPath = req.files?.videoFile?.[0]?.path
    const thumbNailLocalPath = req.files?.thumbnail?.[0]?.path

    if ([videoLocalPath, thumbNailLocalPath].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Both video and thumbnail are required")
    }

    const videO = await uploadOnCloudinary(videoLocalPath)
    const thumbNail = await uploadOnCloudinary(thumbNailLocalPath)

    if (!videO || !thumbNail) {
        throw new ApiError(500, "Could'nt upload on cloudinary,Try again")
    }

    const newVideo = await Video.create({
        videofile: videO?.url,
        thumbnail: thumbNail?.url,
        title,
        description,
        duration: videO?.duration || 0,
        Owner: req.user._id
    })

    if (!newVideo) {
        throw new ApiError(500, "oopsy Somthing went wrong.... try again")
    }

    const currVideo = await Video.findByIdAndUpdate(
        newVideo._id, {
        $set: {
            ispublished: true
        }
    },
        {
            new: true //to get new updated doc
        })

    res.status(200).json(new ApiResponse(201, currVideo, "Video published successfully"))

})

const getVideoById = asynchandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const currVideo = await Video.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "Owner",
                foreignField: "_id",
                as: "currVidOwnerDetails",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            avatar: 1,
                            username: 1

                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                ownerD: {
                    $first: "$currVidOwnerDetails"
                }
            }
        },
        {
            $unset: "$currVidOwnerDetails" //unset completely removes the field (since this field req now)
        },
        {
            $limit: 1
        }

    ])

    if (!currVideo.length) {
        throw new ApiError(404, "video not found")
    }

    res.status(200).json(new ApiResponse(200, currVideo[0], "Video successfully fetched by ID"))
})

const updateVideo = asynchandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const { title, description } = req.body

    if ([title, description, videoId].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Atleast one field must be provided")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const thumbNailLocalPath = req.file?.path

    if (!thumbNailLocalPath) {
        throw new ApiError(400, "thumbnail is required")
    }

    const result = await uploadOnCloudinary(thumbNailLocalPath)
    if (!result) throw new ApiError(500, "Could'nt upload thumbnail")

    const updateDetail = {}
    if (title?.trim()) updateDetail.title = title
    if (description?.trim()) updateDetail.description = description
    if (result?.url?.trim()) updateDetail.thumbnail = result.url

    const updatedVideoDetails = await Video.findByIdAndUpdate(
        videoId, //can directly send the videoId string coz mongoose can handle it
        {
            $set: updateDetail
        },
        {
            new: true
        }
    )

    if (!updatedVideoDetails)
        throw new ApiError(500, "Oop's, problem occured while updating details")

    res.status(200).json(new ApiResponse(200, updatedVideoDetails, "Successfully updated The details"))
})

const deleteVideo = asynchandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "video not found")
    }

    const thumbNailURL = video.thumbnail
    const videoFileURL = video.videofile
    //delete from cloudinary

    //classic
    /*if(thumbNailURL && videoFileURL){
        const TpublicId= extractPublicId(thumbNailURL)
        const VpublicId= extractPublicId(videoFileURL)
        if(TpublicId && VpublicId){
            const TcloudRES= await cloudinary.uploader.destroy(TpublicId)
            const VcloudRES= await cloudinary.uploader.destroy(VpublicId,{resource_type:"auto"})
            if([TcloudRES,VcloudRES].some((field)=> field.result!=="ok" && field.result!=="not found")){
                throw new ApiError(500,"Failed to delete video from Cloudinary")
            }
        }
}
            */

    //easier
    await deleteFromCloudinary(thumbNailURL)
    await deleteFromCloudinary(videoFileURL)

    const Deletedvideo = await Video.findByIdAndDelete(videoId)

    if (!Deletedvideo)
        throw new ApiError(500, "Video not found, or already deleted")

    res.status(200).json(new ApiResponse(200, Deletedvideo, "Video deleted sucessfully"))
})

const togglePublishStatus = asynchandler(async (req, res) => {
    const { videoId } = req.params
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const updatedVideo= await Video.findByIdAndUpdate(videoId,{
        $set:{
            ispublished: !ispublished
        }
    })

  res.status(200).json(
        new ApiResponse(200, updatedVideo, `Video has been ${updatedVideo.isPublished ? "published" : "unpublished"}`)
    );})
    
export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}

//req.params refers to route parameters, which are part of the URL's path itself (e.g., /users/:id). req.query refers to query parameters, which are appended to the URL after a question mark (e.g., /search?q=express).
//Appended to the URL after a question mark (?), with key-value pairs separated by &(e.g., /search?q=express&page=2).  