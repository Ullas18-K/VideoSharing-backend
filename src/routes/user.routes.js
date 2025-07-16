import { Router } from "express";
import {loginUser, logoutUser, refreshTokenRegenerate, registeruser} from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
// const userrouter=Router();
// userrouter.post("/user/register",registeruser)

const router = Router();

router.route("/register").post(
    upload.fields(
        [
            {
            name: "avatar",
            maxcount: 1
        },
        {
            name: "coverimage",
            maxcount: 3
        }
        ]
    ), registeruser); //this is used when you want to chain differeny methods to same route like router.route("/user/:id").get(getUser).put(updateUser).delete(deleteUser);
//it's like https://localhost:8000/api/v1/user/register--

//upload.single("key name")--> allows only one file
//upload.array("key name",count)--> allows only one field with multiple number of files acception 
//upload.feilds([{"key name",count},{"key name",count}])--> allows array of multiple field with multiple number of files acception 
// maxcount:10 --> basically specifies max 10 files can be sent for that particular file in 1 request 

router.route("/login").post(loginUser)
router.route("/Refresh-Regen").post(refreshTokenRegenerate)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
export default router;
