import multer from "multer";
// diskstorage and memory storage can be used
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // save file in temp
  },

  filename: function (req, file, cb) {
    // const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9); // uniqueid
    // cb(null, file.fieldname + "-" + uniqueSuffix);// unique filename
    cb(null, file.originalname); // stays for short time so can use original name
  },
});

export const upload = multer({ storage: storage });
