import mongoose, { Schema } from "mongoose";

const likeSchema= new Schema({  // this'll all comments,videos,tweets a user has liked
    likedBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    comments:{
        type:Schema.Types.ObjectId,
        ref:"Comment"
    },
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    },
    tweet:{
        type:Schema.Types.ObjectId,
        ref:"Tweet"
    }
},{timestamps:true})

export const Like= mongoose.model("Like",likeSchema)