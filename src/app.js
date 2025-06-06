import express from "express";
import cookieParser from "cookie-parser";
import  cors from "cors"
const app=express();

//some built in middlewares
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json())
app.use(express.urlencoded())
app.use(express.static())


export default app