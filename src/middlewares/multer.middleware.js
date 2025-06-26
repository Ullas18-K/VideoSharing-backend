import multer from "multer";

const storage = multer.diskStorage({
    //specifying destination folder
  destination: function (req, file, cb) {
    cb(null, './public/temp')
  },
  //specifying what name will the file be saved in
  filename: function (req, file, cb) {
   // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) for unique suffix
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const upload = multer({ storage: storage })
export default upload