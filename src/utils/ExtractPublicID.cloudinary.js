
export const extractPublicId=(url)=>{
     try {
        // Example URL: https://res.cloudinary.com/abc123/image/upload/v1710720027/foldername/xyz123.jpg
        const parts = url.split("/"); //split divides a string into an ordered list of substrings between the separator
        const fileWithExt = parts[parts.length - 1]; //getting xyz123.jpg
        const publicId = fileWithExt.split(".")[0]; // Remove file extension(jpg)

        // Optional: handle folder structure
        const folder = parts.slice(parts.indexOf("upload") + 1, parts.length - 1).join("/");// to get exact location of the file if nested in folders
        return folder ? `${folder}/${publicId}` : publicId;
    } catch (err) {
        console.error("Error extracting Cloudinary public ID:", err);
        return null;
    }
}