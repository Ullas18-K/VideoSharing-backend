import { asynchandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/Apierrors.js";
import { User } from "../models/user.model.js"
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/Apiresponse.js";
//each method u define here does a different task for a particular endpoint in /user for example the registeruser logic is used when you are directed to /user/register route
const registeruser = asynchandler(async (req, res) => {
    //algorithm kinda
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    //retrive
    const { username, fullname, email, password, } = req.body;
    console.log("email: ", email, username);

    //validation
    if (
        [username, fullname, email, password].some((field) =>
            field?.trim() === "" //a bit advanced but it's  standard and you can also use 'if' for each and every field
        )//.some() checks a callback function for each element in an array and returns boolean ,
        // ?. is a optional chaining operator that works like a short circuit like first it checks if a field value exists or not, if not then it it breaks the chain and returns undefined instead moving further
        //  trim() removes leading and trailing whitespaces except internal spaces
    ) {
        throw new ApiError(400, "All fields are required");
    }

    if (!email.includes("@")) {
        throw new ApiError(400, "Email should include '@' ");
    }

    //user exists??
    //User.findOne({email}) simple but to check if both email and username are unique below is used
    const exixtingUser =await User.findOne({
        $or: [{ email }, { username }] //$or Match if any condition is true
    })
    if (exixtingUser) {
        throw new ApiError(409, "User already exists with that email or Username");
    }

    //images and avatar (multer)
    const Avatarlocalpath = req.files?.avatar[0]?.path;
    const Coverimagelocalpath = req.files?.coverimage[0]?.path;
    //req.files--> The entire object containing all uploaded files like this
    /*req.files = {
                avatar: [ { ...fileObject1 } ],
                gallery: [ { ...file1 }, { ...file2 }, ... ]
    }*/

   //req.files.avatar → is an array (even if only 1 file), so avatar[0] will give first file and actually req.files.avatar object contains many info and path is one among then which gives localpath where multer stored(path is available only on diskstorage)
   
   //upload to cloudinary
   if(!Avatarlocalpath){
    throw new ApiError(400,"Avatar is required");
   }
   const Avatar= await uploadOnCloudinary(Avatarlocalpath);
   const Coverimage= await uploadOnCloudinary(Coverimagelocalpath);

   if(!Avatar){
    throw new ApiError(400,"couldn't upload Avatar... try again");
   }

   //create a user
   const newuser= await User.create({
    fullname,
    username:username.toLowerCase(),
    email,
    password,
    Avatar: Avatar.url, //since Avatar recieves the entire response object from cloudinary, but we need only url
    Coverimage: Coverimage?.url || "" //since coverimage aint necessary
   })
   
   //check user creation and remove refreashtoken and pass from response
   const usercreated= await User.findById(newuser._id).select(
    "-password -RefreshTokens" //select actually selects everything except pass and rtokens you can also select only particular field like select("email username"),but syntax is standard
   )

   if(!usercreated){
    throw new ApiError(500,"something went wrong while registering");
   }

    res.status(201).json(
        new ApiResponse(200,usercreated,"User Registered Successfully")
    );


})

export default registeruser;