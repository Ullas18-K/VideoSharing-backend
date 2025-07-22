import mongoose, { Schema } from "mongoose";


const subschema = new Schema({ 
    subscriber: { //one who is subscribing to other channel
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    channel: {//one who's getting subscribed by users
        type: Schema.Types.ObjectId,
        ref: "User",
    }//so both are user itself, for every pair a new document is created
}, { timestamps: true })

export const Subscription = mongoose.model("Subscription", subschema)