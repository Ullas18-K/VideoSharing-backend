import mongoose, { model, Schema } from "mongoose";
import Jwt from "jsonwebtoken";
import bcrypt from "bcrypt"
const userschema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
    },
    avatar: {
        type: String, //cloudinary URL taken from third party where the avatar is actuallu stored
        required: true
    },
    coverimage: {
        type: String,
        required: true
    },
    WatchHistory: [  //foreign key from vidoe model
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        require: [true, 'Password is required']
    },
    RefreshTokens: {
        type: String
    }


}, {
    timestamps: true
})

//we use this pre/post hooks (middlewares in mongoose) before/after performing any actions like saving, authorization, validation etc  
userschema.pre('save',async function (next) {
    if (!this.isModified("password")) return next();
    this.password =await bcrypt.hash(this.password, 10);
})

//these are custom methods which can be used with documents(tuples) of a model(table) in other files just like the ones which already exist like let's say user1= new User({all fields}) , now user1 is the document and methods like user1.find, .findone(), updateone() can be used alongside the follwinf custom methods
userschema.methods.comparepassword = async function (enteredPass) {
    return await bcrypt.compare(enteredPass, this.password)
} //the await basically kills the outer promise and gives you the actual response (here that bycrypt will returm boolean wrapped in promise ,await takes out the actual response(boolean value) then returns it), now since it's an async function , even this'll return a promise whenever called , so use await just like now, or use .then() if called outside an aync function...

//now these methods are defined to generate jwt tokens for the client basically like giving them a key and they gotta have this key to send requests
userschema.methods.generateAccessToken = function () {
    return Jwt.sign({
        user_id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    )
}

//refreash tokens to increase the lifetime of jwt tokens with client in case access tokens expire
userschema.methods.generateRefreshToken = function () {
return Jwt.sign({
        user_id: this._id,
    },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    )
}
export const User = mongoose.model("User", userschema);