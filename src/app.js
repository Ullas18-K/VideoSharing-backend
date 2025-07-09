import express from "express";
import cookieParser from "cookie-parser";
import  cors from "cors"
const app=express();

//some built in middlewares
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

import userrouter from "./routes/user.routes.js"; //userrouter import name doesnt have to match the same name with which it was exported with, its just an instance of router from routes.js
app.use("/api/v1/user",userrouter); //the /api/v1/user will prefixed for all the next routes that you write for users like /register, /login


export default app