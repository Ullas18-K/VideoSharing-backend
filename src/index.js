// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";

//the second approach
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({
    path: './.env'
})

connectDB();



/*
first approch where we merge everything in one file like the db code and server code

import express from "express";

const app = express();

(async() => { //we using an IIFE to use async/await at the top level
    try {
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

       app.on("error",(err)=>{
          console.log("Error connecting the app ",err);
       })

         app.listen(process.env.PORT,()=>{
            console.log(`Server is running on port ${process.env.PORT}`);
         });
    } catch (error) {
        console.log(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); // Exit the process with failure
    }
})()
    */