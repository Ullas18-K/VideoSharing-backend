import { v2 as cloudinary } from "cloudinary"
import { extractPublicId } from "./ExtractPublicID.cloudinary"


export const deleteFromCloudinary = async (url, resource_type = "image") => {
    const publicId = extractPublicId(url)

    if (publicId) {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type })
        if (result.result !== "ok" && result.result !== "not found") {
            throw new Error("Failed to delete from Cloudinary");
        }
    }
}