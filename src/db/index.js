import mongoose from "mongoose";
import Dotenv from "dotenv";
import { DB_NAME } from "../constants.js";

const connectDB = async ()=>{
   try {
   const connectionInstance=await mongoose.connect(process.env.MONGODB_URI,{
    dbname: DB_NAME,
   })
   
   console.log("connected to MongoDb database ");
   console.log("DB host is ",connectionInstance.connection.host);
   console.log("DB port is ",connectionInstance.connection.port);
   } catch (error) {
    console.error("Error connecting to the DB: ",error.message);
    process.exit(1);
   }
}

export default connectDB;