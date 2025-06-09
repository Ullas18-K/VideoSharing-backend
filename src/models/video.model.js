import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const Videoschema = new Schema({
    videofile: {
        type: String, //cloudinary file
        required: [true, 'Video file not found']
    },
    thumbnail: {
        type: String, //cloudinary file
        required: [true, 'thumbnail not found']
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number, //cloudinary file
        required: true
    },
    likes: {
        type: Number,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    ispublished: {
        type: Boolean
    },
    Owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }

}, {
    timestamps: true
})

Videoschema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", Videoschema)