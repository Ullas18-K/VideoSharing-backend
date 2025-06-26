import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secreat: process.env.CLOUDINARY_API_SECRET
})

//here first we save the file received from frontend in local storage and then upload to cloudinary
const uploadOnCloudinary = async (Localfilepath) => {
    try {
        if (!Localfilepath) return null;
        //just one line uploader method
        const response = await cloudinary.uploader.upload(Localfilepath, {
            resource_type: "auto"
        })
        console.log("File upload success!!", response.url)//the unique url for that particular file
    } catch (err) {
        console.log("error uploading file.... unlinking now");
        fs.unlinkSync(Localfilepath) //unlinks/removes the locally stored file from disk that was received from frontend to avoid duplicates and messing up 
        return null
    }
}
export default uploadOnCloudinary