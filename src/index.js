// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";

//the second approach
import app from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({
    path: './.env'
})

connectDB()
.then(()=>{
    console.log("Successfully connected Server to MongoDB");
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server listening on port: ${process.env.PORT}`);
    })
    app.on("Error",(err)=>{
        console.error("Error in app section ",err);
    })
})
.catch(()=>{
    console.error("Error connecting server to MongoDB");
})



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