import { asynchandler } from "../utils/asyncHandler";
import { Video } from "../models/video.model";
import ApiResponse from "../utils/Apiresponse";
import ApiError from "../utils/Apierrors";

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


export { getAllVideos }

//req.params refers to route parameters, which are part of the URL's path itself (e.g., /users/:id). req.query refers to query parameters, which are appended to the URL after a question mark (e.g., /search?q=express).
//Appended to the URL after a question mark (?), with key-value pairs separated by &(e.g., /search?q=express&page=2).  