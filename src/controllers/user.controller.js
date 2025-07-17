import { asynchandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/Apierrors.js";
import { User } from "../models/user.model.js"
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/Apiresponse.js";
import Jwt from "jsonwebtoken"

//each method u define here does a different task for a particular endpoint in /user for example the registeruser logic is used when you are directed to /user/register route

//general method for genratng refresh and access tokens

const GenerateRefreshAndAccessToken = async (userid) => {
    const currUser = await User.findById(userid);
    const accessJWTToken = currUser.generateAccessToken();
    const refreshJWTToken = currUser.generateRefreshToken();

    currUser.RefreshTokens = refreshJWTToken;
    await currUser.save({ validateBeforeSave: false }) //so that not all other required fields are checked and throw error

    return { accessJWTToken, refreshJWTToken }
}

const registeruser = asynchandler(async (req, res) => {
    //algorithm kinda
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object create entry in db
    // remove password and refresh incomingRefreshToken field from response
    // check for user creation
    // return res
    //retrive
    const { username, fullname, email, password, } = req.body;
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
    const exixtingUser = await User.findOne({
        $or: [{ email }, { username }] //$or Match if any condition is true
    })
    if (exixtingUser) {
        throw new ApiError(409, "User already exists with that email or Username");
    }

    //images and avatar (multer)
    const Avatarlocalpath = req.files?.avatar?.[0]?.path;
    const Coverimagelocalpath = req.files?.coverimage?.[0]?.path;
    //const Coverimagelocalpath = req.files?.coverimage[0]?.path; this gives error if coverimage is not given coz of optional chaining coz first it checks req.files → okay ✅ then coverimage but it's undefined and your'e trynna access index 0 of undefined which crashes

    //req.files--> The entire object containing all uploaded files like this
    /*req.files = {
                avatar: [ { ...fileObject1 } ],
                gallery: [ { ...file1 }, { ...file2 }, ... ]
    }*/

    //req.files.avatar → is an array (even if only 1 file), so avatar[0] will give first file and actually req.files.avatar object contains many info and path is one among then which gives localpath where multer stored(path is available only on diskstorage)

    //upload to cloudinary
    if (!Avatarlocalpath) {
        throw new ApiError(400, "Avatar is required");
    }
    const avataR = await uploadOnCloudinary(Avatarlocalpath);
    const coverImage = await uploadOnCloudinary(Coverimagelocalpath);

    if (!avataR) {
        throw new ApiError(400, "couldn't upload Avatar... try again");
    }

    //create a user
    const newuser = await User.create({
        fullname,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avataR.url, //since Avatar recieves the entire response object from cloudinary, but we need only url
        coverimage: coverImage?.url || "" //since coverimage aint necessary
    })

    //check user creation and remove refreashtoken and pass from response
    const usercreated = await User.findById(newuser._id).select(
        "-password -RefreshTokens" //select actually selects everything except pass and rtokens you can also select only particular field like select("email username"),but syntax is standard
    )

    if (!usercreated) {
        throw new ApiError(500, "something went wrong while registering");
    }

    res.status(201).json(
        new ApiResponse(200, usercreated, "User Registered Successfully")
    ); j


})

const loginUser = asynchandler(async (req, res) => {
    //algo
    //receive client info from req.body
    //login via username or email
    //check for existing username or email
    //check password
    //send access and refresh tokens in form of cookies

    //retrive
    const { email, username, password } = req.body;

    //validation
    if ([email, username].some((field) => {
        field?.trim() === ""
    })) {
        throw new ApiError(400, "Username/Email is required")
    }

    //ckeck for existing username or email
    const currentuser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!currentuser) {
        throw new ApiError(404, "Username or email doesn't exist");
    }

    //check password
    const passexist = await currentuser.comparepassword(password) //not User.comparepass coz User mongoose level object and comparepass method is defined using instance method (userschema.methods.comparepassword )instance method is used When you want to call it on a specific instance(like single user) and static is called on entire model(like findone)  so if you wanted to use User.comparepass then you shoudl've defined it as userschema.static.comparepassword 
    if (!passexist) {
        throw new ApiError(400, "Invalid User Credentials");
    }

    //jwt tokens
    const { accessJWTToken, refreshJWTToken } = await GenerateRefreshAndAccessToken(currentuser._id);

    //cookies 
    //they usually store jwt and sent with response headers automatically but can also add settings like in the options below. they can be accessed using req.cookies from the headers and can be sent to client using res.cookie(all possible coz of cookie parser)
    const options = {//these are collection secure flags
        httpOnly: true, //without these the cookies can be modified by frontend
        secure: true,
        sameSite: "strict",
        // maxAge: 15 * 60 * 1000 for 15 minutes only
    }

    const loggedInUser = await User.findById(currentuser._id)
        .select(
            "-password -RefreshTokens"
        )

    return res.status(200)
        .cookie("AccessTokenJWT", accessJWTToken, options) //name of the cookie specified within " "
        .cookie("RefreshTokenJWT", refreshJWTToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessJWTToken, refreshJWTToken
                },
                "Logged in Successfully"
            )
        )
})

const logoutUser = asynchandler(async (req, res) => {
    //to logout a user first we need his id , so to access that id we make use of his jwt incomingRefreshToken
    //now access/refresh secrete tokens and jwt are different, the secret ones are those in your .env and a incomingRefreshToken which is signed for each user using his info in payload along with the secret key is callled a jwt incomingRefreshToken
    //jwt is unique for eaach user but the secret key is same. the server verifies it using the secret key

    //all above things are done in auth middleware
    //classic
    /*const user = await User.findById(userId);
    if (user) {
      user.RefreshTokens = null;
      await user.save({ validateBeforeSave: false });
    }*/
    await User.findByIdAndUpdate(
        req.user?._id, {
        $set: { RefreshTokens: undefined }
    },
        {
            new: true //will return the new updated value of changed fields(refreshtokens)
        }
    )

    //clear cookies for the user: same options gotta be used that you sent to the user
    const options = {//these are collection secure flags
        httpOnly: true, //without these the cookies can be modified by frontend
        secure: true, //onlh https
        sameSite: "strict",
        // maxAge: 15 * 60 * 1000 for 15 minutes only
    }

    res.status(200)
        .clearCookie("AccessTokenJWT", options)
        .clearCookie("RefreshTokenJWT", options)
        .json(
            new ApiResponse(200, {}, "User Logged out")
        )
})

const refreshTokenRegenerate = asynchandler(async (req, res) => {
    //now this was basically wriiten in order to order to continue sessions due to quick expiration of the accesstokens. so instead of throwing an error amd making the user login again we can make the req hit other api where if his refreshtoekn is valid then we'll just generate him new jwt's 

    const incomingRefreshToken = req.cookies.RefreshTokenJWT  //this is the encrypted incomingRefreshToken not your REFRESH_TOKEN_SECRET . the one user has and you have both are diff  

    if (!incomingRefreshToken) {
        throw new ApiError(400, "refreshToken Not found");
    }

    const decodeJWT = Jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    if (!decodeJWT) {
        throw new ApiError(401, "Unauthorized Token");
    }

    const currentuser = await User.findById(decodeJWT.user_id).select("-password")

    if (currentuser.RefreshTokens !== incomingRefreshToken) { //checking if both have same encrypted refreshtokens
        throw new ApiError(400, "Refresh token is expired or invalid");
    }

    //now generate new ones (both)
    const { AccesstokenNEW, RefreshtokenNEW } = await GenerateRefreshAndAccessToken(currentuser._id)

    const options = {//these are collection secure flags
        httpOnly: true, //without these the cookies can be modified by frontend
        secure: true,
        sameSite: "strict",
        // maxAge: 15 * 60 * 1000 for 15 minutes only
    }

    res.status(200)
        .cookie("AccessTokenJWT", AccesstokenNEW, options)
        .cookie("RefreshTokenJWT", RefreshtokenNEW, options)
        .json(
            new ApiResponse(200,
                {
                    AccesstokenNEW, RefreshtokenNEW
                }
                , "tokens Regenerated")
        )

})

const changeCurrentPassword = asynchandler(async (req, res) => {
    const { currentPassword, Newpassword, confirmPassword } = req.body;

    if ([currentPassword, Newpassword, confirmPassword].some((field) =>
        field?.trim() === "" //gotta return the result
    )) {
        throw new ApiError(401, "All fields are required")
    }

    const currUser = await User.findById(req.user?._id) //got this "user" method from auth middleware

    if (!await currUser.comparepassword(currentPassword)) {
        throw new ApiError(401, "Current password in Incorrect")
    }

    if (Newpassword !== confirmPassword) {
        throw new ApiError(400, "Password does'nt match")
    }

    currUser.password = Newpassword;
    await currUser.save({ validateBeforeSave: false }) //saving is imp

    res.status(200).json(
        new ApiResponse(200, { success: true }, "Password Changes Successfully")
    )
})

const getCurrentUser = asynchandler(async (req, res) => {
    res.status(200).json(new ApiResponse(200, req.user, "User fetched successfully"))
})

const updateAccountDetails = asynchandler(async (req, res) => { //supports single field updation too
    const { username, email, fullname } = req.body;

    if ([currentPassword, Newpassword, confirmPassword].some((field) =>
        field?.trim() === "" //gotta return the result
    )) {
        throw new ApiError(401, "Atleast one field must be provided")
    }

    const existingUser = await User.findOne({
        $or: [{ username }, { email }],
        _id: { $ne: req.user._id } //cz  if the user updates their name or email to the same value they already have, this will still throw an error — because findOne finds themself.
    })
    if (existingUser) {
        throw new ApiError(409, "username or email already exists");
    }

    const updateDetail = {} //to store fields only which are updating
    if (username?.trim()) updateDetail.username = username
    if (fullname?.trim()) updateDetail.fullname = fullname
    if (email?.trim()) updateDetail.email = email


    const currUSer = await User.findByIdAndUpdate(req.user._id,
        {
            $set: updateDetail
        },
        { new: true } //tp return newly updated data
    ).select("-password -RefreshTokens")

    res.status(200).json(new ApiResponse(200, currUSer, "Account Details Updated Successfully"))
})

const UpdateUserAvatar= asynchandler(async (req,res) => {
    const localpath= req.file?.path //req.file coz we're taking only one file unlike multiple files in registeruser , also we'll not defing name too coz it's understood
    if(!localpath){
        throw new ApiError(401,"Avatar is required")
    }

    const avatr=await uploadOnCloudinary(localpath);
    if (!avatr) {
        throw new ApiError(500, "couldn't upload Avatar... try again");
    }

    const updatecover= await User.findByIdAndUpdate(req.user._id,
        {
            $set:{avatar: avatr.url}
        },
        {new:true}
    ).select("-password -RefreshTokens")

    res.status(200).json(new ApiResponse(200,updatecover,"Avatar updated !!"))
})

const UpdateUserCover= asynchandler(async (req,res) => {
    const localpath= req.file?.path //req.file coz we're taking only one file unlike multiple files in registeruser , also we'll not defing name too coz it's understood
    if(!localpath){
        throw new ApiError(401,"cover image is required")
    }

    const coverImage=await uploadOnCloudinary(localpath);
    if (!coverImage) {
        throw new ApiError(500, "couldn't upload coverimage... try again");
    }

    const updatecover=await User.findByIdAndUpdate(req.user._id,
        {
            $set:{coverimage: coverImage.url}
        },
        {new:true}
    ).select("-password -RefreshTokens")

    res.status(200).json(new ApiResponse(200,updatecover,"Cover Image updated !!"))
})
export {
    registeruser,
    loginUser,
    logoutUser,
    refreshTokenRegenerate,
    changeCurrentPassword,
    updateAccountDetails,
    getCurrentUser,
    UpdateUserCover,
    UpdateUserAvatar
};