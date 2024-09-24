import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; // file system from nodejs

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUDNAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_APISECRET, // Click 'View API Keys' above to copy your API secret
});
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded successfull
    //console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  } finally {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
  }
};
// const uploadOnCloudinary = async (localFilePath) => {
//   try {
//     if (!localFilePath) return null;
//     // upload file on cloudinary
//     const response = await cloudinary.uploader.upload(localFilePath, {
//       resource_type: "auto", // auto detect file type
//     }); // file url
//     fs.unlinkSync(localFilePath);
//     // file has been upload
//     // console.log("File is uploaded on cloudinary", response.url);
//     return response;
//   } catch (error) {
//     // remove in sync way not async
//     fs.unlinkSync(localFilePath);
//     // remove the file from local server since first adding file to server than cloudinary is optimal
//   }
// };

export default uploadOnCloudinary;
