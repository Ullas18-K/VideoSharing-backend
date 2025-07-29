import mongoose, { isValidObjectId, mongo } from "mongoose"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asynchandler } from "../utils/asyncHandler.js"
import { Subscription } from "../models/subscriptions.model.js"

const populateUser = () => {
    return {
        $lookup: {
            from: "users",
            localField: "subscriber",
            foreignField: "_id",
            as: "subscriberDetails",
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
const unwindUser = () => {
    return {
        $unwind: { // unwind breaks up the array of items into single objects
            path: "$subscriberDetails",
            preserveNullAndEmptyArrays: true //to avoid crashes if owner does'nt exist by placing Null
        }
    };
};

const toggleSubscription = asynchandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    //check for existing like
    let message = ""
    const existingSub = await Subscription.findOne({
        subscriber: req.user._id,
        channel: mongoose.Types.ObjectId(channelId)
    })

    if (existingSub) {
        //unliked
        await Subscription.findByIdAndDelete(existingLike._id)
        message = "Unsubscribed to channel"
    }
    else {
        //like
        await Subscription.create({
            subscriber: req.user._id,
            channel: mongoose.Types.ObjectId(channelId)
        })
        message = "Subscribed to channel"
    }

    res.status(200).json(new ApiResponse(200, {}, message))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asynchandler(async (req, res) => {
    const { channelId } = req.params
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    const channelInfo = await Subscription.aggregate([
        {
            $match: {
                channel: mongoose.Types.ObjectId(channelId)
            }
        },
        populateUser(),
        unwindUser(),
        {
            $group: {
                _id: null,
                subsCount: { $sum: 1 },
                subscribers: { $push: "$subscriberDetails" },//$push to push subscriBERS field to subscribers
            },
        },
        {
            $project: {
                _id:0,
                subsCount: 1,
                subscribers: 1
            }
        }
    ])

    if (!channelInfo.length) {
        throw new ApiError(404, "No subscribers Yet")
    }

    res.status(200).json(new ApiResponse(200, channelInfo[0], "Subscribers fetched successfuly"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asynchandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!mongoose.Types.ObjectId.isValid(subscriberId)){
        throw new ApiError(400,"Invalid subscriberId ")
    }

    const subscribedChannels= await Subscription.aggregate([
        {
            $match:{
                subscriber:mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:"users",
                let:{channelIdprevStage:"$channel"},
                pipeline:[
                    {
                        $match: {
                            $expr: { $eq: ["$_id", "$$channelId"] }
                        }
                    },
                    {
                       $lookup:{
                        from:"subscriptions",
                        localField:"_id",
                        foreignField:"channel",
                        as:"ChannelSubs"
                       }
                    },
                    {
                        $addFields:{
                            ChannelSubcount:{$size:"$ChannelSubs"}
                        }
                    },
                    {
                        $project:{
                            fullname:1,
                            avatar:1,
                            username:1,
                            ChannelSubcount:1
                        }
                    }
                ],
                as:"channelDetails" //after this each subscription doc will channelDetails field array with one object containg user info
            }
        },
        {
            $unwind:"$channelDetails"
        },
        {
            $replaceRoot: { newRoot: "$channelDetails" } //replaceRoot removes all fields n keeps only newRoot fields in the subscription doc
        }
    ])

    if(!subscribedChannels.length){
        throw new ApiError(404,"No subscribed channels")
    }

    res.status(200).json(new ApiResponse(200,subscribedChannels,"channels fetched successfully"
    ))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}