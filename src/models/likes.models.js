import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({
  likedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  targetId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  targetType: {
    type: String,
    enum: ["Video", "Comment", "Tweet"],
    required: true
  }
}, { timestamps: true });


export const Like= mongoose.model("Like",likeSchema)